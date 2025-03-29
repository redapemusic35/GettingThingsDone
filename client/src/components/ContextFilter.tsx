import { BadgeCheck } from "lucide-react";

interface ContextFilterProps {
  contexts: string[];
  selectedContext: string | null;
  onSelectContext: (context: string | null) => void;
}

export default function ContextFilter({ 
  contexts, 
  selectedContext, 
  onSelectContext 
}: ContextFilterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-2">Filter by context:</p>
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              className={`inline-flex whitespace-nowrap items-center px-3 py-1.5 rounded-full text-xs font-medium 
                ${selectedContext === null 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
              onClick={() => onSelectContext(null)}
            >
              All
            </button>
            
            {contexts.map((context) => (
              <button 
                key={context}
                className={`inline-flex whitespace-nowrap items-center px-3 py-1.5 rounded-full text-xs font-medium 
                  ${selectedContext === context 
                    ? "bg-primary text-white" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
                onClick={() => onSelectContext(context)}
              >
                +@{context}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
