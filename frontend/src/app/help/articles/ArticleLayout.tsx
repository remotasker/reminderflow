'use client';

import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

interface ArticlePageProps {
  title: string;
  category: string;
  readTime: number;
  children: React.ReactNode;
}

export function ArticleLayout({ title, category, readTime, children }: ArticlePageProps) {
  return (
    <Layout>
      <div className="max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 md:px-8">
        
        {/* Back Button */}
        <Link href="/help/articles" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} />
          Back to Articles
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">{category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{readTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>Updated April 2, 2026</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </Layout>
  );
}
