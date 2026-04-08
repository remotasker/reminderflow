'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  BellRing,
  Globe,
  MapPin,
  AlignLeft,
  Type,
  Loader2,
  Save,
  Plus,
  Trash2,
  ListChecks,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export type QuestionType = 'text' | 'textarea' | 'checkbox' | 'checkbox_group';
export type ReminderType = 'confirmation' | '24h' | '1h' | '10m';

const REMINDER_OPTIONS: Array<{
  value: ReminderType;
  label: string;
  description: string;
}> = [
  { value: 'confirmation', label: 'Confirmation', description: 'Send immediately after registration' },
  { value: '24h', label: '24-hour reminder', description: 'Send one day before the event starts' },
  { value: '1h', label: '1-hour reminder', description: 'Send one hour before the event starts' },
  { value: '10m', label: '10-minute reminder', description: 'Send a final nudge shortly before go time' },
];

const DEFAULT_REMINDER_SCHEDULE: ReminderType[] = ['confirmation', '24h', '1h'];

export interface CustomQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

interface ApiFormField {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  locked?: boolean;
  options?: string[];
}

interface EventPayload {
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  reminderSchedule: ReminderType[];
  meetingLink?: string;
  formSchema: ApiFormField[];
}

interface InitialEventData {
  id?: string;
  title?: string;
  description?: string;
  date?: string;
  event_date?: string;
  eventTime?: string;
  event_time?: string;
  timezone?: string;
  location?: string;
  meetingLink?: string;
  meeting_link?: string;
  reminders?: Array<{ type?: string | null }>;
  questions?: CustomQuestion[];
  formSchema?: ApiFormField[] | string | null;
  form_schema?: ApiFormField[] | string | null;
}

interface EventFormState {
  id?: string;
  title: string;
  description: string;
  dateTime: string;
  timezone: string;
  meetingLink: string;
  reminderSchedule: ReminderType[];
  questions: CustomQuestion[];
}

interface EventFormProps {
  initialData?: InitialEventData | null;
  onSubmit: (data: EventPayload) => Promise<void>;
  isLoading?: boolean;
  /** Override the submit button label. Defaults to "Create Event" or "Save Changes". */
  submitLabel?: string;
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function normalizeQuestionType(type: unknown): QuestionType {
  if (type === 'textarea' || type === 'checkbox' || type === 'checkbox_group') return type;
  if (type === 'yes_no') return 'checkbox';
  if (type === 'multiple_choice') return 'checkbox_group';
  return 'text';
}

function extractDatePart(value?: string): string {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
}

function extractTimePart(value?: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? '';
}

function parseSchema(rawSchema: InitialEventData['formSchema'] | InitialEventData['form_schema']): ApiFormField[] {
  let parsed: unknown = rawSchema;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((f) => !!f && typeof f === 'object' && !Array.isArray(f))
    .map((f) => {
      const s = f as Record<string, unknown>;
      const options = Array.isArray(s.options)
        ? s.options.filter((o): o is string => typeof o === 'string')
        : undefined;
      return {
        id:       typeof s.id === 'string' && s.id.trim() ? s.id : crypto.randomUUID(),
        label:    typeof s.label === 'string' ? s.label : '',
        type:     normalizeQuestionType(s.type),
        required: s.required === true,
        locked:   s.locked === true,
        options,
      };
    })
    .filter((f) => f.label.trim().length > 0);
}

function mapSchemaToQuestions(schema: ApiFormField[]): CustomQuestion[] {
  return schema.map((f) => ({
    id:       f.id,
    text:     f.label,
    type:     f.type,
    options:  f.type === 'checkbox_group' ? (f.options?.length ? f.options : ['']) : [''],
    required: f.required,
  }));
}

function mapLegacyQuestions(questions: InitialEventData['questions']): CustomQuestion[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => ({
    id:       typeof q.id === 'string' && q.id.trim() ? q.id : crypto.randomUUID(),
    text:     typeof q.text === 'string' ? q.text : '',
    type:     normalizeQuestionType(q.type),
    options:  Array.isArray(q.options) && q.options.length > 0 ? q.options : [''],
    required: q.required === true,
  }));
}

function parseReminderSchedule(initialData?: InitialEventData | null): ReminderType[] {
  const reminderTypes = Array.isArray(initialData?.reminders)
    ? initialData.reminders
        .map((reminder) => reminder?.type)
        .filter((type): type is ReminderType => REMINDER_OPTIONS.some((option) => option.value === type))
    : [];

  if (reminderTypes.length > 0) {
    return REMINDER_OPTIONS
      .map((option) => option.value)
      .filter((value) => reminderTypes.includes(value));
  }

  return initialData?.id ? [] : DEFAULT_REMINDER_SCHEDULE;
}

function buildInitialState(initialData?: InitialEventData | null): EventFormState {
  const schema          = parseSchema(initialData?.formSchema ?? initialData?.form_schema);
  const legacyQuestions = mapLegacyQuestions(initialData?.questions);
  const eventDate       = extractDatePart(initialData?.event_date ?? initialData?.date);
  const eventTime       = extractTimePart(initialData?.event_time ?? initialData?.eventTime);
  const legacyDateTime  =
    typeof initialData?.date === 'string' && initialData.date.includes('T')
      ? initialData.date.slice(0, 16)
      : '';

  return {
    id:          initialData?.id,
    title:       initialData?.title ?? '',
    description: initialData?.description ?? '',
    dateTime:    eventDate && eventTime ? `${eventDate}T${eventTime}` : legacyDateTime,
    timezone:    initialData?.timezone ?? getBrowserTimezone(),
    meetingLink: initialData?.meetingLink ?? initialData?.meeting_link ?? initialData?.location ?? '',
    reminderSchedule: parseReminderSchedule(initialData),
    questions:   schema.length > 0 ? mapSchemaToQuestions(schema) : legacyQuestions,
  };
}

const inputCls = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all placeholder:text-slate-400";

export function EventForm({ initialData, onSubmit, isLoading = false, submitLabel }: EventFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormState>({
    title: '',
    description: '',
    dateTime: '',
    timezone: 'UTC',
    meetingLink: '',
    reminderSchedule: DEFAULT_REMINDER_SCHEDULE,
    questions: [],
  });

  useEffect(() => {
    setFormData(buildInitialState(initialData));
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleReminder = (value: ReminderType) => {
    setFormData((prev) => {
      const selected = new Set(prev.reminderSchedule);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);

      return {
        ...prev,
        reminderSchedule: REMINDER_OPTIONS
          .map((option) => option.value)
          .filter((optionValue) => selected.has(optionValue)),
      };
    });
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: crypto.randomUUID(), text: '', type: 'text', options: [''], required: false },
      ],
    }));
  };

  const updateQuestion = (
    index: number,
    field: keyof CustomQuestion,
    value: CustomQuestion[keyof CustomQuestion]
  ) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      const next = { ...questions[index], [field]: value };
      if (field === 'type' && value !== 'checkbox_group') next.options = [''];
      if (field === 'type' && value === 'checkbox_group' && next.options.length === 0) next.options = [''];
      questions[index] = next;
      return { ...prev, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  };

  const addOption = (qi: number) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      questions[qi] = { ...questions[qi], options: [...questions[qi].options, ''] };
      return { ...prev, questions };
    });
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qi].options];
      options[oi] = value;
      questions[qi] = { ...questions[qi], options };
      return { ...prev, questions };
    });
  };

  const removeOption = (qi: number, oi: number) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      questions[qi] = { ...questions[qi], options: questions[qi].options.filter((_, i) => i !== oi) };
      return { ...prev, questions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const [eventDate = '', eventTime = ''] = formData.dateTime.split('T');
    const formSchema = formData.questions.map((q) => ({
      id:       q.id,
      label:    q.text.trim(),
      type:     q.type,
      required: q.required,
      ...(q.type === 'checkbox_group'
        ? { options: q.options.map((o) => o.trim()).filter(Boolean) }
        : {}),
    }));
    const payload: EventPayload = {
      title:       formData.title,
      description: formData.description,
      eventDate,
      eventTime,
      timezone:    formData.timezone,
      reminderSchedule: formData.reminderSchedule,
      formSchema,
    };
    const meetingLink = formData.meetingLink.trim();
    if (meetingLink) payload.meetingLink = meetingLink;
    await onSubmit(payload);
  };

  const isEditMode    = !!formData.id;
  const defaultLabel  = isEditMode ? 'Save Changes' : 'Create Event';
  const buttonLabel   = submitLabel ?? defaultLabel;
  const isNextStep    = !!submitLabel;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="p-6 md:p-8 space-y-8">

        {/* ── Event details ──────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Event Title</label>
            <div className="relative group">
              <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors pointer-events-none" size={16} />
              <input type="text" name="title" required value={formData.title} onChange={handleChange}
                placeholder="e.g., Q3 Marketing Summit"
                className={`${inputCls} pl-11`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Date & Time</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors pointer-events-none" size={16} />
                <input type="datetime-local" name="dateTime" required value={formData.dateTime} onChange={handleChange}
                  className={`${inputCls} pl-11`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Timezone</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors pointer-events-none" size={16} />
                <input type="text" name="timezone" required value={formData.timezone} onChange={handleChange}
                  placeholder="Africa/Nairobi"
                  className={`${inputCls} pl-11`} />
              </div>
              <p className="mt-2 text-[11px] text-slate-400 font-medium ml-1">Auto-filled from your browser when possible.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Meeting Link</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors pointer-events-none" size={16} />
              <input type="url" name="meetingLink" value={formData.meetingLink} onChange={handleChange}
                placeholder="https://zoom.us/j/..."
                className={`${inputCls} pl-11`} />
            </div>
            <p className="mt-2 text-[11px] text-slate-400 font-medium ml-1">Leave blank if you do not have a meeting URL yet.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Description</label>
            <div className="relative group">
              <AlignLeft className="absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors pointer-events-none" size={16} />
              <textarea name="description" rows={4} value={formData.description} onChange={handleChange}
                placeholder="Provide a brief overview..."
                className={`${inputCls} pl-11 resize-y`} />
            </div>
          </div>
        </div>

        {/* ── Registration questions ──────────────────────────── */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                <BellRing size={18} />
              </div>
              Reminder Schedule
            </h3>
            <p className="text-sm text-slate-500 font-normal mt-1 ml-1">
              Choose which automated emails attendees should receive for this event.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REMINDER_OPTIONS.map((option) => {
              const checked = formData.reminderSchedule.includes(option.value);

              return (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-[18px] border p-4 transition-all cursor-pointer ${
                    checked
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'border-slate-200/80 bg-white text-slate-900 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleReminder(option.value)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-slate-900 dark:accent-slate-900"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className={`text-xs ${checked ? 'text-slate-200 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                      {option.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                  <ListChecks size={18} />
                </div>
                Registration Questions
              </h3>
              <p className="text-sm text-slate-500 font-normal mt-1 ml-1">Ask attendees custom questions when they register.</p>
            </div>
            <button type="button" onClick={addQuestion}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all shadow-sm active:scale-95 w-full sm:w-auto">
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="space-y-5">
            {formData.questions.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-[20px] bg-slate-50/50 dark:bg-slate-800/10">
                <HelpCircle size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-500">No custom questions added yet.</p>
              </div>
            ) : (
              formData.questions.map((question, questionIndex) => (
                <div key={question.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[20px] shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-center shadow-sm">
                        {questionIndex + 1}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Question</label>
                          <input type="text" value={question.text}
                            onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                            placeholder="e.g., Will you attend in person?"
                            className={inputCls}
                            required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-2 ml-1">Format</label>
                          <select value={question.type}
                            onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value as QuestionType)}
                            className={`${inputCls} appearance-none cursor-pointer`}>
                            <option value="text">Short text</option>
                            <option value="textarea">Long text</option>
                            <option value="checkbox">Yes / No</option>
                            <option value="checkbox_group">Multiple choice</option>
                          </select>
                        </div>
                      </div>
                      
                      <button type="button" onClick={() => removeQuestion(questionIndex)}
                        className="flex-shrink-0 sm:mt-7 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-end sm:self-auto">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 sm:pl-12">
                      <input type="checkbox" id={`req-${question.id}`} checked={question.required}
                        onChange={(e) => updateQuestion(questionIndex, 'required', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 accent-slate-900 dark:accent-white cursor-pointer" />
                      <label htmlFor={`req-${question.id}`} className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                        Required
                      </label>
                    </div>

                    {question.type === 'checkbox' && (
                      <div className="sm:pl-12 pt-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3 ml-1">Attendees will see</p>
                        <div className="flex flex-wrap gap-3">
                          {['Yes', 'No'].map((label) => (
                            <div key={label} className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 rounded-[16px] cursor-default select-none">
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === 'checkbox_group' && (
                      <div className="sm:pl-12 pt-2 space-y-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest ml-1">Answer options</p>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                            <input type="text" value={option}
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className={inputCls}
                              required />
                            <button type="button" onClick={() => removeOption(questionIndex, optionIndex)}
                              disabled={question.options.length <= 1}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addOption(questionIndex)}
                          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mt-2">
                          <Plus size={14} /> Add option
                        </button>
                      </div>
                    )}

                    {(question.type === 'text' || question.type === 'textarea') && (
                      <div className="sm:pl-12 pt-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-3 ml-1">Attendees will see</p>
                        {question.type === 'text' ? (
                          <div className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 border border-dashed border-slate-300 dark:border-slate-700 rounded-[16px] text-sm text-slate-400 cursor-default select-none">
                            Short answer text...
                          </div>
                        ) : (
                          <div className="w-full px-4 py-3 h-24 bg-slate-50/50 dark:bg-slate-800/10 border border-dashed border-slate-300 dark:border-slate-700 rounded-[16px] text-sm text-slate-400 cursor-default select-none">
                            Long answer text...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="bg-slate-50/50 dark:bg-slate-800/20 px-6 sm:px-8 py-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
        <button type="button" onClick={() => router.push('/events')}
          className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
          Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-sm">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isNextStep ? (
            <ArrowRight size={16} />
          ) : (
            <Save size={16} />
          )}
          {isLoading ? 'Saving...' : buttonLabel}
        </button>
      </div>
    </form>
  );
}
