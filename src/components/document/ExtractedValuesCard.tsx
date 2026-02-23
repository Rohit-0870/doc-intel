// import { useEffect, useMemo, useState } from "react";
// import { ConfidenceMeter } from "./ConfidenceMeter";
// import { isComplexValue, formatName } from "./DynamicValueRenderer";
// import { EditableField } from "./EditableField";
// import { EditableTable } from "./EditableTable";
// import { AutoFitText } from "./AutoFitText";
// import { Button } from "@/components/ui/button";
// import { Eye, Send, Pencil } from "lucide-react";
// import type { ExtractedValue, FieldValue } from "@/types/document";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// interface ExtractedValuesCardProps {
//   extractedValues: ExtractedValue[];
//   onSubmit?: (values: ExtractedValue[]) => Promise<void> | void;
//   isSaving?: boolean;
//   onHoverFieldChange?: (fieldName: string | null) => void;

//   // ✅ NEW
//   onFieldClick?: (fieldName: string) => void;
// }

// function safeUpper(value: unknown): string {
//   if (value === null || value === undefined) return "N/A";
//   return String(value).toUpperCase();
// }

// function getPageLabel(item: ExtractedValue): string {
//   if (item.page_number !== null && item.page_number !== undefined) {
//     return `Page ${item.page_number}`;
//   }

//   return "";
// }


// export function ExtractedValuesCard({
//   extractedValues,
//   onSubmit,
//   isSaving = false,
//   onHoverFieldChange,
//   onFieldClick,
// }: ExtractedValuesCardProps) {
//   const [editedValues, setEditedValues] = useState<ExtractedValue[]>(extractedValues);
//   const [isEditing, setIsEditing] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);

//   useEffect(() => {
//     setEditedValues(extractedValues);
//     setIsEditing(false);
//   }, [extractedValues]);

//   const isEmptyValue = (value: FieldValue) => {
//     if (value === null || value === undefined) return true;
//     if (typeof value === "string" && value.trim() === "") return true;
//     if (Array.isArray(value) && value.length === 0) return true;
//     if (typeof value === "object" && !Array.isArray(value)) {
//       return Object.keys(value as Record<string, unknown>).length === 0;
//     }
//     return false;
//   };

//   const isLongTextField = (fieldName: string) => {
//     const key = fieldName.toLowerCase();
//     return (
//       key.includes("address") ||
//       key.includes("description") ||
//       key.includes("notes") ||
//       key.includes("remark") ||
//       key.includes("comments") ||
//       key.includes("terms")
//     );
//   };

//   const { scalarValues, complexValues } = useMemo(() => {
//     const nonEmpty = editedValues.filter((v) => !isEmptyValue(v.field_value));
//     return {
//       scalarValues: nonEmpty.filter((v) => !isComplexValue(v.field_value)),
//       complexValues: nonEmpty.filter((v) => isComplexValue(v.field_value)),
//     };
//   }, [editedValues]);

//   const handleValueChange = (fieldName: string, newValue: FieldValue) => {
//     setEditedValues((prev) =>
//       prev.map((item) =>
//         item.field_name === fieldName ? { ...item, field_value: newValue } : item
//       )
//     );
//   };

//   const handleSubmit = async () => {
//     try {
//       await onSubmit?.(editedValues);
//     } catch (e) {
//       console.error("Submit error:", e);
//     }
//   };

//   return (
//     <div className="animate-fade-in rounded-xl bg-card p-6 shadow-card">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-lg font-semibold text-foreground">Extracted Values</h2>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Data extracted from your document
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button
//             variant={isEditing ? "default" : "outline"}
//             size="sm"
//             onClick={() => setIsEditing(!isEditing)}
//             className="gap-2"
//             disabled={isSaving}
//           >
//             <Pencil className="w-4 h-4" />
//             {isEditing ? "Done Editing" : "Edit"}
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => setShowPreview(true)}
//             className="gap-2"
//           >
//             <Eye className="w-4 h-4" />
//             Preview
//           </Button>

//           <Button
//             size="sm"
//             onClick={handleSubmit}
//             className="gap-2"
//             disabled={isSaving}
//           >
//             <Send className="w-4 h-4" />
//             {isSaving ? "Approving..." : "Approve"}
//           </Button>
//         </div>
//       </div>

//       {/* Scalar Values */}
//       {scalarValues.length > 0 && (
//         <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//           {scalarValues.map((item, index) => {
//             const longField = isLongTextField(item.field_name);
//             const maxFontPx = longField ? 16 : 18;
//             const minFontPx = longField ? 7 : 9;

//             return (
//               <div
//                 key={item.field_name}
//                 style={{ animationDelay: `${(index + 1) * 50}ms` }}
//                 className="
//                   group relative h-[140px] overflow-hidden rounded-lg border border-border bg-background p-3
//                   flex flex-col cursor-pointer
//                   transition-all duration-200 ease-out
//                   hover:border-primary/30 hover:shadow-soft
//                   hover:scale-[1.03] hover:-translate-y-1 hover:z-10
//                   will-change-transform
//                 "
//                 onMouseEnter={() => onHoverFieldChange?.(item.field_name)}
//                 onMouseLeave={() => onHoverFieldChange?.(null)}
//                 onClick={() => onFieldClick?.(item.field_name)}
//               >
//                 <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
//                   {formatName(item.field_name)}
//                 </p>

//                 <div className="mt-1 flex-1 min-h-0">
//                   {isEditing ? (
//                     <EditableField
//                       value={item.field_value}
//                       onChange={(newValue) =>
//                         handleValueChange(item.field_name, newValue)
//                       }
//                       isEditing={isEditing}
//                     />
//                   ) : (
//                     <AutoFitText
//                       text={String(item.field_value)}
//                       maxFontPx={maxFontPx}
//                       minFontPx={minFontPx}
//                     />
//                   )}
//                 </div>

//                 <div className="mt-2">
//                   <ConfidenceMeter confidence={item.confidence ?? 0} size="sm" />
//                 </div>

//                 <p className="mt-1 text-[11px] text-muted-foreground">
//                   {getPageLabel(item)} · {safeUpper(item.extraction_method)}
//                   {item.was_corrected ? " · ✅ Corrected" : ""}
//                 </p>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Complex Values */}
//       {complexValues.map((item) => (
//         <div
//           key={item.field_name}
//           className="mt-6 cursor-pointer"
//           onMouseEnter={() => onHoverFieldChange?.(item.field_name)}
//           onMouseLeave={() => onHoverFieldChange?.(null)}
//           onClick={() => onFieldClick?.(item.field_name)}
//         >
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-semibold text-foreground">
//               {formatName(item.field_name)}
//             </h3>

//             <div className="flex items-center gap-3">
//               <ConfidenceMeter confidence={item.confidence ?? 0} size="sm" />
//               <span className="text-xs text-muted-foreground">
//                 Page {item.page_number ?? "-"} · {safeUpper(item.extraction_method)}
//                 {item.was_corrected ? " · ✅ Corrected" : ""}
//               </span>
//             </div>
//           </div>

//           <EditableTable
//             value={item.field_value}
//             onChange={(newValue) => handleValueChange(item.field_name, newValue)}
//             isEditing={isEditing}
//           />
//         </div>
//       ))}

//       {scalarValues.length === 0 && complexValues.length === 0 && (
//         <div className="mt-6 text-center text-muted-foreground py-8">
//           No extracted values found
//         </div>
//       )}

//       <Dialog open={showPreview} onOpenChange={setShowPreview}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
//           <DialogHeader>
//             <DialogTitle>Preview Extracted Data</DialogTitle>
//           </DialogHeader>

//           <pre className="mt-4 p-4 bg-muted rounded-lg overflow-auto text-sm">
//             {JSON.stringify(
//               editedValues.reduce((acc, item) => {
//                 acc[item.field_name] = item.field_value;
//                 return acc;
//               }, {} as Record<string, FieldValue>),
//               null,
//               2
//             )}
//           </pre>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { isComplexValue, formatName } from "./DynamicValueRenderer";
import { EditableField } from "./EditableField";
import { EditableTable } from "./EditableTable";
import { AutoFitText } from "./AutoFitText";
import { Button } from "@/components/ui/button";
import { Eye, Send, Pencil } from "lucide-react";
import type { ExtractedValue, FieldValue } from "@/types/document";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExtractedValuesCardProps {
  extractedValues: ExtractedValue[];
  onSubmit?: (values: ExtractedValue[]) => Promise<void> | void;
  isSaving?: boolean;
  onHoverFieldChange?: (fieldName: string | null) => void;
  onFieldClick?: (fieldName: string) => void;
}

function safeUpper(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  return String(value).toUpperCase();
}

function getPageLabel(item: ExtractedValue): string {
  if (item.page_number !== null && item.page_number !== undefined) {
    return `Page ${item.page_number}`;
  }
  return "";
}

export function ExtractedValuesCard({
  extractedValues,
  onSubmit,
  isSaving = false,
  onHoverFieldChange,
  onFieldClick,
}: ExtractedValuesCardProps) {
  const [editedValues, setEditedValues] =
    useState<ExtractedValue[]>(extractedValues);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  /** ✅ DOCUMENT IS APPROVED IF ANY FIELD WAS CORRECTED */
  const isApproved = useMemo(() => {
    return extractedValues.some((v) => v.was_corrected);
  }, [extractedValues]);

  useEffect(() => {
    setEditedValues(extractedValues);
    setIsEditing(false);
  }, [extractedValues]);

  const isEmptyValue = (value: FieldValue) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value as Record<string, unknown>).length === 0;
    }
    return false;
  };

  const isLongTextField = (fieldName: string) => {
    const key = fieldName.toLowerCase();
    return (
      key.includes("address") ||
      key.includes("description") ||
      key.includes("notes") ||
      key.includes("remark") ||
      key.includes("comments") ||
      key.includes("terms")
    );
  };

  const { scalarValues, complexValues } = useMemo(() => {
    const nonEmpty = editedValues.filter((v) => !isEmptyValue(v.field_value));
    return {
      scalarValues: nonEmpty.filter((v) => !isComplexValue(v.field_value)),
      complexValues: nonEmpty.filter((v) => isComplexValue(v.field_value)),
    };
  }, [editedValues]);

  const handleValueChange = (fieldName: string, newValue: FieldValue) => {
    if (isApproved) return;
    setEditedValues((prev) =>
      prev.map((item) =>
        item.field_name === fieldName ? { ...item, field_value: newValue } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (isApproved) return;
    try {
      await onSubmit?.(editedValues);
    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  return (
    <div className="animate-fade-in rounded-xl bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Extracted Values
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Data extracted from your document
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
            disabled={isSaving || isApproved}
          >
            <Pencil className="w-4 h-4" />
            {isEditing ? "Done Editing" : "Edit"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            className="gap-2"
            disabled={isSaving || isApproved}
          >
            <Send className="w-4 h-4" />
            {isSaving ? "Approving..." : "Approve"}
          </Button>
        </div>
      </div>

      {/* Scalar Values */}
      {scalarValues.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scalarValues.map((item, index) => {
            const longField = isLongTextField(item.field_name);
            const maxFontPx = longField ? 16 : 18;
            const minFontPx = longField ? 7 : 9;

            return (
              <div
                key={item.field_name}
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
                className="
                  group relative h-[140px] overflow-hidden rounded-lg border border-border bg-background p-3
                  flex flex-col cursor-pointer
                  transition-all duration-200 ease-out
                  hover:border-primary/30 hover:shadow-soft
                  hover:scale-[1.03] hover:-translate-y-1 hover:z-10
                  will-change-transform
                "
                onMouseEnter={() => onHoverFieldChange?.(item.field_name)}
                onMouseLeave={() => onHoverFieldChange?.(null)}
                onClick={() => onFieldClick?.(item.field_name)}
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {formatName(item.field_name)}
                </p>

                <div className="mt-1 flex-1 min-h-0">
                  {isEditing && !isApproved ? (
                    <EditableField
                      value={item.field_value}
                      onChange={(newValue) =>
                        handleValueChange(item.field_name, newValue)
                      }
                      isEditing={isEditing}
                    />
                  ) : (
                    <AutoFitText
                      text={String(item.field_value)}
                      maxFontPx={maxFontPx}
                      minFontPx={minFontPx}
                    />
                  )}
                </div>

                <div className="mt-2">
                  <ConfidenceMeter
                    confidence={item.confidence ?? 0}
                    size="sm"
                  />
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {getPageLabel(item)} · {safeUpper(item.extraction_method)}
                  {item.was_corrected ? " · ✅ Corrected" : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Complex Values */}
      {complexValues.map((item) => (
        <div
          key={item.field_name}
          className="mt-6 cursor-pointer"
          onMouseEnter={() => onHoverFieldChange?.(item.field_name)}
          onMouseLeave={() => onHoverFieldChange?.(null)}
          onClick={() => onFieldClick?.(item.field_name)}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {formatName(item.field_name)}
            </h3>

            <div className="flex items-center gap-3">
              <ConfidenceMeter confidence={item.confidence ?? 0} size="sm" />
              <span className="text-xs text-muted-foreground">
                Page {item.page_number ?? "-"} ·{" "}
                {safeUpper(item.extraction_method)}
                {item.was_corrected ? " · ✅ Corrected" : ""}
              </span>
            </div>
          </div>

          <EditableTable
            value={item.field_value}
            onChange={(newValue) =>
              handleValueChange(item.field_name, newValue)
            }
            isEditing={isEditing && !isApproved}
          />
        </div>
      ))}

      {scalarValues.length === 0 && complexValues.length === 0 && (
        <div className="mt-6 text-center text-muted-foreground py-8">
          No extracted values found
        </div>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview Extracted Data</DialogTitle>
          </DialogHeader>

          <pre className="mt-4 p-4 bg-muted rounded-lg overflow-auto text-sm">
            {JSON.stringify(
              editedValues.reduce((acc, item) => {
                acc[item.field_name] = item.field_value;
                return acc;
              }, {} as Record<string, FieldValue>),
              null,
              2
            )}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
