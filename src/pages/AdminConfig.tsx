
import { useState, useMemo } from "react";
import { PlusCircle, Sparkles, Pencil, ArrowLeft, Search, FileText, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

import ManualDocumentConfig, { DocumentConfig } from "@/features/admin-config/components/ManualDocumentConfig";
import { FileUpload } from "@/features/admin-config/components/FileUploadAi";
import { useDocumentTypes } from "@/features/admin-config/hooks/useDocumentTypes";
import { useDocumentTypeById } from "@/features/admin-config/hooks/useGetDocumentDetails";
import { useDeleteDocumentType } from "@/features/admin-config/hooks/useDeleteDocumentType";
import { useUpdateDocumentStatus } from "@/features/admin-config/hooks/useUpdateDocumentStatus";

/* ---------- Mode ---------- */
type Mode =
  | { type: "list" }
  | { type: "manual"; value?: DocumentConfig }
  | { type: "ai" };

const AdminConfig = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ type: "list" });

  const { data, isLoading } = useDocumentTypes({
    page: 1,
    pageSize: 20,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: editingDoc, isLoading: isEditingLoading } = useDocumentTypeById(editingId ?? undefined);

  const deleteMutation = useDeleteDocumentType();
  const statusMutation = useUpdateDocumentStatus();

  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<typeof data.documentTypes[number]>[]>(
  () => [
    {
      accessorKey: "name",
      header: "Document Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "fieldCount",
      header: "Fields",
      cell: ({ row }) => (
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-muted text-foreground">
          {row.original.fieldCount} fields
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            row.original.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              row.original.status === "active"
                ? "bg-green-600"
                : "bg-gray-500"
            }`}
          />
          {row.original.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => (
        <span className="capitalize text-muted-foreground">
          {row.original.createdBy}
        </span>
      ),
    },
    {
      accessorKey: "isApproved",
      header: "Approval",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            row.original.isApproved
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {row.original.isApproved ? "Approved" : "Pending"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-4">
          <Pencil
            className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditingId(row.original.id); 
              setMode({ type: "manual" });   
            }}
          />

          <Switch
          checked={row.original.status === "active"}
          onCheckedChange={(checked) => {
            statusMutation.mutate({
              id: row.original.id,
              status: checked ? "active" : "inactive",
            });
          }}
        />

          <Trash2 
            className={`h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive ${
              deleteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
            }`} 
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${row.original.name}"?`)) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          />
        </div>
      ),
    },
  ],
  [data]
);

  const table = useReactTable({
    data: data?.documentTypes ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  /* ---------- Conditional renders ---------- */
  if (mode.type === "manual") {
    // Pass fetched data if editing
    const prefill = editingDoc ?? mode.value; 

    return isEditingLoading ? (
      <div className="p-10 text-center">Loading document details...</div>
    ) : (
      <ManualDocumentConfig
        value={prefill}
        onBack={() => {
          setEditingId(null);
          setMode({ type: "list" });
        }}
      />
    );
  }


  if (mode.type === "ai") {
    const handleFileProcessed = (fileName: string) => {
      const extractedConfig: DocumentConfig = {
        name: fileName.replace(/\.[^/.]+$/, ""),
        fields: [
          { id: crypto.randomUUID(), name: "Field 1", type: "text", required: true },
          { id: crypto.randomUUID(), name: "Field 2", type: "number", required: false },
        ],
      };
      setMode({ type: "manual", value: extractedConfig });
    };

    const handleCancel = () => {
      console.log("Upload canceled");
      setMode({ type: "list" });
    };

    return (
      <div className="p-10 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setMode({ type: "list" })} 
            variant="ghost"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Upload Document</h1>
            <p className="text-sm text-muted-foreground">
              Upload a sample document for AI analysis
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-10">
          <div className="w-[700px]">
            <FileUpload
              onFileProcessed={handleFileProcessed}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Default List Mode ---------- */
  return (
    <div className="space-y-6 p-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage document types and extraction field configurations
          </p>
        </div>

        {/* Create dropdown */}
        <div className="relative">
          <Button onClick={() => setOpen((v) => !v)} className="gap-2">
            <PlusCircle />
            Create New Document Type
            <ChevronDown />
          </Button>

          {open && (
            <div className="absolute right-0 mt-2 w-60 rounded-md border bg-background shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMode({ type: "manual" });
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
                Manual Configuration
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMode({ type: "ai" });
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
              >
                <Sparkles className="h-4 w-4" />
                AI Assisted Setup
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-80">
        <Input 
          placeholder="Search document types..." 
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
      </div>

      <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40">
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            <ChevronUp
                              className={`h-3 w-3 ${
                                isSorted === "asc"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 ${
                                isSorted === "desc"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center text-sm">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                  No document types available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminConfig;
