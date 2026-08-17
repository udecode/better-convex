'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { getLatestKitcnCommands } from '@/lib/kitcn-commands';

const homeTemplateOptions = [
  {
    label: 'next',
    command: 'init -t next',
  },
  {
    label: 'start',
    command: 'init -t start',
  },
  {
    label: 'vite',
    command: 'init -t vite',
  },
  {
    label: 'react',
    command: 'init',
  },
  {
    label: 'expo',
    command: 'init -t expo',
  },
] as const;

/**
 * The only interactive element on the landing page.
 *
 * Kept as its own client module so the rest of `app/(home)/page.tsx` — the
 * feature grid, the step copy, and the four syntax-highlighted code blocks —
 * stays server-rendered instead of shipping a second time as client JS.
 */
export function TemplatePicker() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<(typeof homeTemplateOptions)[number]['label']>('next');
  const selectedOption =
    homeTemplateOptions.find(({ label }) => label === selectedTemplate) ??
    homeTemplateOptions[0];
  const initCommand = getLatestKitcnCommands(selectedOption.command).npm;

  return (
    <div className="mt-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-fd-border">
      <div className="border-fd-border border-b bg-[#282a36] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5555]/80" />
            <div className="h-3 w-3 rounded-full bg-[#f1fa8c]/80" />
            <div className="h-3 w-3 rounded-full bg-[#50fa7b]/80" />
          </div>
          <div
            aria-label="Template picker"
            className="inline-flex rounded-full border border-white/10 bg-white/5 p-1"
            role="tablist"
          >
            {homeTemplateOptions.map(({ label }) => {
              const isSelected = label === selectedTemplate;

              return (
                <button
                  aria-selected={isSelected}
                  className={`rounded-full px-3 py-1 font-medium text-xs capitalize transition ${
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  key={label}
                  onClick={() => setSelectedTemplate(label)}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="relative">
        <pre className="overflow-x-auto bg-[#282a36] px-4 py-5 pr-14 text-left font-mono text-[#f8f8f2] text-sm md:text-base">
          <code>{initCommand}</code>
        </pre>
        <CopyButton
          className="top-3 right-3 border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          label="Copy command"
          value={initCommand}
        />
      </div>
    </div>
  );
}
