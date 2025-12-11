import React from 'react';

// Simple markdown renderer for demo purposes. 
// In a production app, use 'react-markdown'
interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const formatText = (text: string) => {
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    
    // Headers
    formatted = formatted.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-emerald-400 mt-4 mb-2">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-emerald-500 mt-6 mb-3">$1</h2>');
    
    // Lists
    formatted = formatted.replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>');
    formatted = formatted.replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>');

    // Paragraphs (naive split by newline)
    return formatted.split('\n').map((line, i) => {
      if (line.trim() === '') return <br key={i} />;
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} className="mb-1" />;
    });
  };

  return (
    <div className="text-gray-300 text-sm leading-relaxed space-y-2">
      {formatText(content)}
    </div>
  );
};

export default MarkdownRenderer;