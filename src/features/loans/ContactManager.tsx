import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { listContacts, createContact, deleteContact } from "@/lib/finance.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Trash2, Loader2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export function ContactManager() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => listContacts(),
  });

  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createContact);
  const deleteFn = useServerFn(deleteContact);

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createFn>[0]) => createFn(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      router.invalidate();
      toast.success("Contact added");
      setName("");
      setPhone("");
      setEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      router.invalidate();
      toast.success("Contact removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      data: {
        name,
        phone: phone || undefined,
        email: email || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-1.5 h-4 w-4" /> Manage Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contacts & Counterparties</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="contact-name" className="text-xs">Contact Name</Label>
            <Input
              id="contact-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="contact-phone" className="text-xs">Phone</Label>
              <Input
                id="contact-phone"
                placeholder="+1 555 0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact-email" className="text-xs">Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Contact
          </Button>
        </form>

        <div className="mt-4 border-t border-border pt-3 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">Existing Contacts</h4>
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No contacts saved yet.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border border-border text-xs">
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="flex items-center gap-3 text-muted-foreground mt-0.5">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
