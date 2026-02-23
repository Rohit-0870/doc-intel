import { FC, useState } from "react";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Save,
  Trash2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";



import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCreateDocumentType } from "@/features/admin-config/hooks/useCreateDocumentType";
import { useUpdateDocumentType } from "@/features/admin-config/hooks/useUpdateDocumentType";

/* ---------- Types ---------- */

type FieldType = "text" | "number" | "date" | "currency";

export type ExtractionField = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
};

export type DocumentConfig = {
  id?: string;
  name: string;
  fields: ExtractionField[];
};

interface Props {
  value?: DocumentConfig;
  onBack: () => void;
}

/* ---------- Constants ---------- */

const FIELD_TYPES: { label: string; value: FieldType }[] = [
  { label: "Text", value: "text" },
  { label: "Numeric", value: "number" },
  { label: "Date", value: "date" },
  { label: "Currency", value: "currency" },
];

const createEmptyField = (): ExtractionField => ({
  id: crypto.randomUUID(),
  name: "",
  type: "text",
  required: false,
});

/* ---------- Component ---------- */

const ManualDocumentConfig: FC<Props> = ({ value, onBack }) => {
  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType();

  const [name, setName] = useState(value?.name ?? "");
  const [fields, setFields] = useState<ExtractionField[]>(
    value?.fields?.length ? value.fields : [createEmptyField()],
  );

  /* ---------- Field Actions ---------- */

  const addField = () => {
    setFields((prev) => [...prev, createEmptyField()]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (
    id: string,
    updates: Partial<ExtractionField>,
  ) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    );
  };

  return (
    <div className="space-y-8 p-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"  
          >
            <ArrowLeft className="h-7 w-7" />
          </Button>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              DOCUMENT TYPE NAME
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document type name"
              className="mt-2 w-80"
            />
          </div>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            const payload = { id: value?.id, name, fields };

            if (value?.id) {
              updateMutation.mutate(payload, {
                onSuccess: onBack, // close view after update
              });
            } else {
              createMutation.mutate(payload, {
                onSuccess: () => {
                  onBack(); // close manual config
                },
              });
            }
          }}
        >
          <Save />
          Save Configuration
        </Button>


      </div>

      {/* Extraction Fields */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          EXTRACTION FIELDS ({fields.length})
        </h2>

        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-4 rounded-xl border bg-background px-4 py-4 relative"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />

            {/* Field name */}
            <Input
              value={field.name}
              placeholder="Field name"
              className="flex-1"
              onChange={(e) =>
                updateField(field.id, {
                  name: e.target.value,
                })
              }
            />

           {/* Type dropdown (radio style) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                    variant="outline"
                    className="w-40 justify-between font-normal"
                     >
                    {
                        FIELD_TYPES.find(
                        (t) => t.value === field.type,
                        )?.label
                    }
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-40">
                    <DropdownMenuRadioGroup
                    value={field.type}
                    onValueChange={(value) =>
                        updateField(field.id, {
                        type: value as FieldType,
                        })
                    }
                    >
                    {FIELD_TYPES.map((type) => (
                        <DropdownMenuRadioItem
                        key={type.value}
                        value={type.value}
                        className="cursor-pointer"
                        >
                        {type.label}
                        </DropdownMenuRadioItem>
                    ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Required */}
            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) =>
                  updateField(field.id, {
                    required: checked,
                  })
                }
              />
              <span className="text-sm text-muted-foreground">
                Required
              </span>
            </div>

            {/* Delete */}
            <button
              onClick={() => removeField(field.id)}
              disabled={fields.length === 1}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add field */}
        <button
          onClick={addField}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2 text-sm text-muted-foreground hover:bg-accent hover:border-muted-foreground hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add New Field
        </button>
      </div>
    </div>
  );
};

export default ManualDocumentConfig;
