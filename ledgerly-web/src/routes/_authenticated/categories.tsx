import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listCategories,
  createCategory,
  deleteCategory,
} from "@/lib/finance.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Tags } from "lucide-react";
import { toast } from "sonner";

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/_authenticated/categories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  component: CategoriesPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">{error.message}</div>
  ),
});

function CategoriesPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const queryClient = useQueryClient();
  const router = useRouter();
  const del = useServerFn(deleteCategory);
  const mutation = useMutation({
    mutationFn: del,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize where your money goes and comes from.
          </p>
        </div>
        <NewCategoryDialog />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryGroup title="Expense" tone="destructive" categories={expense} onDelete={(id) => mutation.mutate({ data: { id } })} />
        <CategoryGroup title="Income" tone="success" categories={income} onDelete={(id) => mutation.mutate({ data: { id } })} />
      </div>
    </div>
  );
}

function CategoryGroup({
  title,
  tone,
  categories,
  onDelete,
}: {
  title: string;
  tone: "success" | "destructive";
  categories: Array<{ id: string; name: string; color: string | null }>;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
            tone === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          }`}
        >
          {categories.length}
        </span>
      </div>
      {categories.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Tags className="h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No {title.toLowerCase()} categories.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {categories.map((c) => (
            <li key={c.id} className="group flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color ?? "#22D3A0" }}
                />
                <span className="text-sm">{c.name}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete "${c.name}"?`)) onDelete(c.id);
                }}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                aria-label="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("#22D3A0");
  const queryClient = useQueryClient();
  const router = useRouter();
  const create = useServerFn(createCategory);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.invalidate();
      toast.success("Category created");
      setOpen(false);
      setName("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> New category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ data: { name, kind, color } });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-color">Color</Label>
              <Input id="cat-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
