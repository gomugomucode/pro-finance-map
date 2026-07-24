import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Camera, Image as ImageIcon, FileText, UploadCloud, CheckCircle2 } from "lucide-react-native";

export default function VaultScreen() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ["mobile_receipt_vault"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];

      const { data } = await supabase
        .from("receipt_documents")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Camera access is needed to capture receipt evidence.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadReceiptImage(result.assets[0].uri);
    }
  };

  const handleGalleryPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadReceiptImage(result.assets[0].uri);
    }
  };

  const uploadReceiptImage = async (uri: string) => {
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("User not authenticated");

      const filename = `receipt_${Date.now()}.jpg`;
      const path = `${userData.user.id}/${filename}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: storageError } = await supabase.storage
        .from("receipts")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage.from("receipts").getPublicUrl(path);

      // Record in database table
      await supabase.from("receipt_documents").insert({
        user_id: userData.user.id,
        file_name: filename,
        file_path: path,
        file_url: publicUrlData.publicUrl,
        file_type: "image/jpeg",
        ocr_status: "pending",
      });

      Alert.alert("Success", "Receipt evidence uploaded to Vault!");
      queryClient.invalidateQueries({ queryKey: ["mobile_receipt_vault"] });
    } catch (e: any) {
      Alert.alert("Upload Error", e.message || "Could not upload receipt image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipt & Evidence Vault</Text>
        <Text style={styles.subtitle}>Upload receipts, invoices, and warranties</Text>
      </View>

      {/* Upload Actions Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCameraCapture} disabled={uploading}>
          <Camera size={22} color="#FFFFFF" />
          <Text style={styles.actionText}>Snap Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.galleryBtn]} onPress={handleGalleryPick} disabled={uploading}>
          <ImageIcon size={22} color="#FFFFFF" />
          <Text style={styles.actionText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadingBox}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.uploadingText}>Uploading receipt image to Supabase Vault...</Text>
        </View>
      )}

      {/* Document List */}
      <FlatList
        data={documents || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.docCard}>
            <View style={styles.docLeft}>
              <View style={styles.docIconBadge}>
                <FileText size={20} color="#2563EB" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{item.file_name || "Receipt Document"}</Text>
                <Text style={styles.docMeta}>
                  OCR: {item.ocr_status?.toUpperCase() || "PENDING"} • {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {item.file_url ? (
              <Image source={{ uri: item.file_url }} style={styles.docThumb} />
            ) : (
              <CheckCircle2 size={18} color="#10B981" />
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
  },
  galleryBtn: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  uploadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1E293B",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  uploadingText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  docLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  docIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2563EB20",
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  docMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  docThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#0F172A",
  },
});
