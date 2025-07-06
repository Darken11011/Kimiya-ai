// Export all component definitions
export { startCallDefinition } from './StartCallComponent';
export { apiRequestDefinition } from './PlayAudioComponent';
export { aiNodeDefinition } from './AINodeComponent';
export { endCallDefinition } from './EndCallComponent';
export { transferCallDefinition } from './TransferCallComponent';
export { toolNodeDefinition } from './ToolNodeComponent';

// Export all components
export { default as StartCallComponent } from './StartCallComponent';
export { default as APIRequestComponent } from './PlayAudioComponent';
export { default as AINodeComponent } from './AINodeComponent';
export { default as EndCallComponent } from './EndCallComponent';
export { default as TransferCallComponent } from './TransferCallComponent';
export { default as ToolNodeComponent } from './ToolNodeComponent';

import { ComponentDefinition } from '../../../../types/componentTypes';
import { startCallDefinition } from './StartCallComponent';
import { apiRequestDefinition } from './PlayAudioComponent';
import { aiNodeDefinition } from './AINodeComponent';
import { endCallDefinition } from './EndCallComponent';
import { transferCallDefinition } from './TransferCallComponent';
import { toolNodeDefinition } from './ToolNodeComponent';

// Array of all component definitions for easy registration
export const coreComponentDefinitions: ComponentDefinition[] = [
  startCallDefinition,
  apiRequestDefinition,
  aiNodeDefinition,
  transferCallDefinition,
  toolNodeDefinition,
  endCallDefinition
];

// Function to register all core components
export const registerCoreComponents = (registry: any) => {
  coreComponentDefinitions.forEach(definition => {
    registry.register(definition);
  });
};
