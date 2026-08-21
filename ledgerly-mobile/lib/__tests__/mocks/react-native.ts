export const Platform = {
  OS: "web",
  select: (obj: any) => obj.web || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const View = "View";
export const Text = "Text";
export const TouchableOpacity = "TouchableOpacity";
export const TextInput = "TextInput";
export const ScrollView = "ScrollView";
export const SafeAreaView = "SafeAreaView";
export const Alert = {
  alert: () => {},
};
