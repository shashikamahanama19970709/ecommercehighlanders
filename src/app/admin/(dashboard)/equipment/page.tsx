'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FieldDefinition, Sport } from '@/types/product';
import { NoticeBanner, type Notice } from '@/components/notice-banner';

type SpecFieldDraft = {
  name: string;
  label: string;
  type: FieldDefinition['type'];
  optionsText: string;
  required: boolean;
};

type Template = {
  _id?: string;
  name: string;
  label: string;
  type: FieldDefinition['type'];
  options?: string[];
};

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function optionsToText(options?: string[]): string {
  if (!options || options.length === 0) return '';
  return options.join(', ');
}

function textToOptions(optionsText: string): string[] {
  return optionsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminEquipmentSpecificationsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [notice, setNotice] = useState<Notice>(null);

  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('');

  const [fields, setFields] = useState<SpecFieldDraft[]>([]);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [templateToAdd, setTemplateToAdd] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      const [sportsRes, templatesRes] = await Promise.all([
        fetch('/api/sports', { cache: 'no-store' }),
        fetch('/api/specification-fields', { cache: 'no-store' }),
      ]);

      const sportsData = (await sportsRes.json()) as Sport[];
      setSports(Array.isArray(sportsData) ? sportsData : []);

      const templateData = (await templatesRes.json()) as Template[];
      setTemplates(Array.isArray(templateData) ? templateData : []);
    };

    void run();
  }, []);

  const selectedSport = useMemo(
    () => sports.find((s) => s?._id === selectedSportId) ?? null,
    [sports, selectedSportId]
  );

  const equipmentTypes = useMemo(() => {
    const types = Array.isArray(selectedSport?.equipmentTypes) ? selectedSport!.equipmentTypes : [];
    return [...new Set(types.map((t) => String(t).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [selectedSport]);

  useEffect(() => {
    // Reset equipment + fields if sport changes.
    setSelectedEquipmentType('');
    setFields([]);
  }, [selectedSportId]);

  useEffect(() => {
    if (!selectedEquipmentType) {
      setFields([]);
      return;
    }

    const run = async () => {
      setIsLoadingSchema(true);
      try {
        const res = await fetch(`/api/schemas?type=${encodeURIComponent(selectedEquipmentType)}`, { cache: 'no-store' });
        if (!res.ok) {
          setFields([]);
          return;
        }
        const data = await res.json();
        const incoming = Array.isArray(data?.fields) ? (data.fields as FieldDefinition[]) : [];
        setFields(
          incoming.map((f) => ({
            name: typeof f?.name === 'string' ? f.name : '',
            label: typeof f?.label === 'string' ? f.label : '',
            type: (f?.type ?? 'text') as FieldDefinition['type'],
            optionsText: optionsToText(f?.options),
            required: Boolean(f?.required),
          }))
        );
      } finally {
        setIsLoadingSchema(false);
      }
    };

    void run();
  }, [selectedEquipmentType]);

  const addBlankField = () => {
    setFields((prev) => [
      ...prev,
      { name: '', label: '', type: 'text', optionsText: '', required: false },
    ]);
  };

  const addFromTemplate = () => {
    if (!templateToAdd) return;
    const found = templates.find((t) => t.name === templateToAdd);
    if (!found) return;

    setFields((prev) => [
      ...prev,
      {
        name: found.name,
        label: found.label,
        type: found.type,
        optionsText: optionsToText(found.options),
        required: false,
      },
    ]);
    setTemplateToAdd('');
  };

  const updateField = (index: number, patch: Partial<SpecFieldDraft>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSchema = async () => {
    if (!selectedEquipmentType) {
      setNotice({ type: 'error', message: 'Equipment Specifications save failed.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        equipmentType: selectedEquipmentType,
        fields: fields.map((f) => ({
          name: f.name.trim(),
          label: f.label.trim(),
          type: f.type,
          options: f.type === 'select' ? textToOptions(f.optionsText) : [],
          required: f.required,
        })),
      };

      const res = await fetch('/api/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setNotice({ type: 'error', message: err?.message || 'Equipment Specifications save failed.' });
        return;
      }

      setNotice({ type: 'success', message: 'Equipment Specifications saved successfully.' });

      // Refresh template library so newly-saved fields become selectable.
      const templatesRes = await fetch('/api/specification-fields', { cache: 'no-store' });
      const templateData = (await templatesRes.json()) as Template[];
      setTemplates(Array.isArray(templateData) ? templateData : []);
    } catch {
      setNotice({ type: 'error', message: 'Equipment Specifications save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Equipment Specifications</h1>
          <p className="text-muted-foreground">
            Select Sport → Equipment Type, then define the specification fields that will appear under Product Specifications.
          </p>
        </div>

        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sport</label>
              <select
                value={selectedSportId}
                onChange={(e) => setSelectedSportId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select sport</option>
                {sports.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Equipment Type</label>
              <select
                value={selectedEquipmentType}
                onChange={(e) => setSelectedEquipmentType(e.target.value)}
                disabled={!selectedSportId}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">Select equipment type</option>
                {equipmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Add From Library</label>
              <div className="flex gap-2">
                <select
                  value={templateToAdd}
                  onChange={(e) => setTemplateToAdd(e.target.value)}
                  className="min-w-[240px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a field</option>
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.label} ({t.name})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addFromTemplate}
                  disabled={!templateToAdd}
                  className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Library grows automatically when you save a schema.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addBlankField}
                disabled={!selectedEquipmentType}
                className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add New Field
              </button>
              <button
                type="button"
                onClick={saveSchema}
                disabled={!selectedEquipmentType || isSaving}
                className="cursor-pointer rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Fields</h2>
              {isLoadingSchema && <span className="text-xs text-muted-foreground">Loading schema…</span>}
            </div>

            {selectedEquipmentType && fields.length === 0 && !isLoadingSchema ? (
              <div className="rounded-xl border border-dashed bg-muted p-6 text-sm text-muted-foreground">
                No fields yet. Add fields and click Save.
              </div>
            ) : null}

            <div className="space-y-3">
              {fields.map((f, idx) => {
                const showOptions = f.type === 'select';
                return (
                  <div key={`${idx}-${f.name}`} className="rounded-xl border bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Key (name)</label>
                        <input
                          value={f.name}
                          onChange={(e) => updateField(idx, { name: e.target.value })}
                          onBlur={() => {
                            if (f.name.trim()) return;
                            if (!f.label.trim()) return;
                            updateField(idx, { name: toSlug(f.label) });
                          }}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="e.g. weight"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Label</label>
                        <input
                          value={f.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="e.g. Weight (kg)"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Type</label>
                        <select
                          value={f.type}
                          onChange={(e) => updateField(idx, { type: e.target.value as FieldDefinition['type'] })}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="weight">Weight</option>
                          <option value="color">Color</option>
                          <option value="select">Dropdown</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Required</label>
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            checked={f.required}
                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-foreground">Yes</span>
                        </div>
                      </div>
                    </div>

                    {showOptions && (
                      <div className="mt-3 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Dropdown options (comma-separated)</label>
                        <input
                          value={f.optionsText}
                          onChange={(e) => updateField(idx, { optionsText: e.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="e.g. Small, Medium, Large"
                        />
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
