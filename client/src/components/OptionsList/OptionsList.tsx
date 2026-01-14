import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';

interface OptionsTypes {
  videoId: string;
  channel: string;
  description: string;
  url: string;
  name: string;
  img: string;
}

interface OptionListTypes {
  options: OptionsTypes[];
  handleClick: (option: OptionsTypes) => void;
  isLoading: boolean;
}

const OptionsList = ({ options, handleClick, isLoading }: OptionListTypes): JSX.Element => {
  if (isLoading) {
    return (
      <Card className="bg-card border-border/50 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Searching...</span>
        </div>
      </Card>
    );
  }

  if (!options.length) {
    return (
      <Card className="bg-card border-border/50 rounded-xl shadow-2xl p-6">
        <p className="text-center text-muted-foreground text-sm">No results found</p>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50 rounded-xl shadow-2xl overflow-hidden">
      <ScrollArea className="max-h-80">
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <div
              key={option.videoId}
              className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleClick(option)}
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-20 h-12 rounded-md overflow-hidden bg-black">
                {option.img ? (
                  <img
                    src={option.img}
                    alt={option.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{option.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {option.channel}
                </p>
              </div>

              {/* Add button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(option);
                }}
                className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default OptionsList;
