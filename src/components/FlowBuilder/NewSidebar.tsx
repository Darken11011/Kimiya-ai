import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFlowStore } from '../../stores/flowStore';
import { ComponentDefinition, COMPONENT_CATEGORIES } from '../../types/componentTypes';
import { cn } from '@/lib/utils';

interface ComponentItemProps {
  component: ComponentDefinition;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, component: ComponentDefinition) => void;
}

const ComponentItem: React.FC<ComponentItemProps> = ({ component, onDragStart }) => {
  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg border cursor-move transition-all duration-200",
        "hover:shadow-md hover:scale-105 active:scale-95",
        "bg-white border-gray-200 hover:border-gray-300"
      )}
      style={{ 
        borderLeftColor: component.color,
        borderLeftWidth: '4px'
      }}
      onDragStart={(event) => onDragStart(event, component)}
      draggable
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: component.color }}
      >
        {component.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">
          {component.displayName}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {component.description}
        </div>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  category: string;
  components: ComponentDefinition[];
  onDragStart: (event: React.DragEvent<HTMLDivElement>, component: ComponentDefinition) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  category, 
  components, 
  onDragStart 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (components.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-2 h-auto font-medium text-left"
        >
          <span className="text-sm text-gray-700">{category}</span>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {components.length}
            </span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {components.map((component) => (
          <ComponentItem
            key={component.type}
            component={component}
            onDragStart={onDragStart}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

const NewSidebar: React.FC = () => {
  const { getAllComponents, sidebarCollapsed, toggleSidebar } = useFlowStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const allComponents = getAllComponents();

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, component: ComponentDefinition) => {
    event.dataTransfer.setData('application/reactflow', component.type);
    event.dataTransfer.setData('component', JSON.stringify(component));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Filter and group components
  const { filteredComponents, componentsByCategory } = useMemo(() => {
    const filtered = searchQuery
      ? allComponents.filter(component =>
          component.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          component.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (component.tags && component.tags.some(tag => 
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ))
        )
      : allComponents;

    const grouped = filtered.reduce((acc, component) => {
      if (!acc[component.category]) {
        acc[component.category] = [];
      }
      acc[component.category].push(component);
      return acc;
    }, {} as Record<string, ComponentDefinition[]>);

    return {
      filteredComponents: filtered,
      componentsByCategory: grouped
    };
  }, [allComponents, searchQuery]);

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-white shadow-md border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white shadow-md border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Components</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {searchQuery ? (
          // Show search results
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-3">
              {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} found
            </div>
            {filteredComponents.map((component) => (
              <ComponentItem
                key={component.type}
                component={component}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        ) : (
          // Show categorized components
          Object.entries(componentsByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, components]) => (
              <CategorySection
                key={category}
                category={category}
                components={components}
                onDragStart={onDragStart}
              />
            ))
        )}
        
        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No components found</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewSidebar;
