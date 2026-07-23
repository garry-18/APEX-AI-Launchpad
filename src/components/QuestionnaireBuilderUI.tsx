import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Search, SlidersHorizontal, ArrowUpDown, Eye, FileText, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Plus, Trash2, ArrowUp, ArrowDown, Copy
} from "lucide-react";

// Questionnaire Builder Question Type Options
export const QUESTION_TYPES = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Paragraph/Long Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown Select" },
  { value: "radio", label: "Radio Selection" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "file_upload", label: "File Upload" },
  { value: "rating", label: "1-10 Rating Scale" }
];

// Single Question Configuration Card Component
export function QuestionCard({ 
  question, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onDuplicate 
}: { 
  question: any; 
  onUpdate: (q: any) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Question Title (e.g. Tell us about your React experience)" 
            value={question.title} 
            onChange={(e) => onUpdate({ ...question, title: e.target.value })}
            className="w-full bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={question.type}
            onChange={(e) => onUpdate({ ...question, type: e.target.value })}
            className="bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            {QUESTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <button onClick={onMoveUp} className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-lg">
            <ArrowUp className="size-4" />
          </button>
          <button onClick={onMoveDown} className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-lg">
            <ArrowDown className="size-4" />
          </button>
          <button onClick={onDuplicate} className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-900 rounded-lg">
            <Copy className="size-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px]">
        <label className="flex items-center gap-2 font-bold text-gray-500 uppercase tracking-wider">
          <input 
            type="checkbox" 
            checked={question.required} 
            onChange={(e) => onUpdate({ ...question, required: e.target.checked })}
            className="rounded text-[#FF7A00] focus:ring-[#FF7A00] size-3.5"
          />
          Required Question
        </label>
      </div>
    </div>
  );
}

// Live Questionnaire Preview Component
export function QuestionPreview({ questions, title, desc }: { questions: any[], title: string, desc: string }) {
  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4 space-y-1">
        <h3 className="text-base font-black text-gray-900">{title || "Untitled Questionnaire"}</h3>
        <p className="text-xs text-gray-500">{desc || "Provide brief responses to the milestones below."}</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-1.5 text-xs text-gray-700">
            <label className="font-bold text-gray-800">
              {q.title || `Question ${idx + 1}`}
              {q.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            
            {q.type === "short_text" && (
              <input type="text" placeholder="Short answer text" className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none" disabled />
            )}
            {q.type === "long_text" && (
              <textarea placeholder="Long answer text" className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs h-20 focus:outline-none" disabled />
            )}
            {q.type === "number" && (
              <input type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none" disabled />
            )}
            {q.type === "dropdown" && (
              <select className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none" disabled>
                <option>Select Option</option>
              </select>
            )}
            {q.type === "file_upload" && (
              <div className="border border-dashed border-gray-250 rounded-xl p-4 text-center text-[10px] text-gray-400">
                Click to upload dossier file package
              </div>
            )}
            {q.type === "rating" && (
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} className="size-8 rounded-lg border border-gray-200 text-xs font-semibold" disabled>{n}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Student Response Details Drawer Component
export function ResponseDrawer({ response, onClose }: { response: any; onClose: () => void }) {
  if (!response) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-tight">Response Details</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{response.name} • {response.college}</p>
          </div>
          <button onClick={onClose} className="size-8 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Submission Time</span>
              <span className="font-semibold text-gray-900">{response.submittedAt}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-150">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Overall Score</span>
              <span className="font-semibold text-gray-900">Pass</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Questions & Answers</h4>
            {response.answers?.map((ans: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="font-bold text-gray-800">{ans.question}</div>
                <p className="text-gray-650 bg-gray-50 p-2.5 rounded-xl border border-gray-100">{ans.answer}</p>
              </div>
            )) || (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="font-bold text-gray-800">1. Why do you want to join the APEX AI cohort?</div>
                  <p className="text-gray-650 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    To gain experience with production-scale LLM training algorithms and pipeline infrastructure.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-gray-800">2. Rates your proficiency in Python / PyTorch development.</div>
                  <p className="text-gray-650 bg-gray-50 p-2.5 rounded-xl border border-gray-100">9 / 10</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
