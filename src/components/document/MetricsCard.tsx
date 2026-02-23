import { CheckCircle2, XCircle, AlertTriangle, Clock, Hash, FileText, DollarSign, Cpu } from "lucide-react";
import type { Statistics, TokenUsage, CostInfo } from "@/types/document";

interface MetricsCardProps {
  isValid: boolean;
  requiresHumanReview: boolean;
  hitlFields: string[];
  statistics: Statistics;
  tokenUsage: TokenUsage;
  costInfo: CostInfo;
  timeTakenSeconds: number;
  metricsRecordId: number;
  rawTextPreview: string;
  error: string | null;
}

export function MetricsCard({
  isValid,
  requiresHumanReview,
  hitlFields,
  statistics,
  tokenUsage,
  costInfo,
  timeTakenSeconds,
  metricsRecordId,
  rawTextPreview,
  error,
}: MetricsCardProps) {
  return (
    <div className="animate-fade-in rounded-xl bg-card p-6 shadow-card" style={{ animationDelay: "200ms" }}>
      <h2 className="text-lg font-semibold text-foreground">Processing Metrics</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Extraction statistics and processing details
      </p>

      {/* Status Indicators */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Validation</p>
            <p className="font-semibold text-foreground">{isValid ? "Valid" : "Invalid"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          {requiresHumanReview ? (
            <AlertTriangle className="h-5 w-5 text-warning" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-success" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Human Review</p>
            <p className="font-semibold text-foreground">{requiresHumanReview ? "Required" : "Not Required"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Processing Time</p>
            <p className="font-semibold text-foreground">{timeTakenSeconds.toFixed(2)}s</p>
          </div>
        </div>
      </div>

      {/* HITL Fields */}
      {hitlFields.length > 0 && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm font-medium text-warning">Fields requiring review:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hitlFields.map((field) => (
              <span key={field} className="rounded-full bg-warning/20 px-3 py-1 text-xs font-medium text-warning">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Statistics</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Total Fields</p>
            <p className="text-xl font-bold text-foreground">{statistics.total_fields}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Mandatory</p>
            <p className="text-xl font-bold text-foreground">{statistics.mandatory_count}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
            <p className="text-xl font-bold text-foreground">{(statistics.average_confidence * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">High Confidence</p>
            <p className="text-xl font-bold text-foreground">{statistics.high_confidence_count}</p>
          </div>
        </div>
      </div>

      {/* Token Usage & Cost */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Token Usage</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input</span>
              <span className="font-mono text-foreground">{tokenUsage.input_tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output</span>
              <span className="font-mono text-foreground">{tokenUsage.output_tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-semibold text-foreground">{tokenUsage.total_tokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-success" />
            <h3 className="text-sm font-semibold text-foreground">Cost Info</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Input Cost</span>
              <span className="font-mono text-foreground">${costInfo.input_cost_usd.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output Cost</span>
              <span className="font-mono text-foreground">${costInfo.output_cost_usd.toFixed(6)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-semibold text-success">${costInfo.total_cost_usd.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3" />
          <span>Record ID: {metricsRecordId}</span>
        </div>
      </div>

      {/* Raw Text Preview */}
      {rawTextPreview && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Raw Text Preview</h3>
          </div>
          <pre className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground overflow-x-auto max-h-40 overflow-y-auto font-mono">
            {rawTextPreview}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Error: {error}</p>
        </div>
      )}
    </div>
  );
}
