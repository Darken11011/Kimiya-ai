# Import/Export Functionality

This document explains how to use the import and export features in the Flow Builder.

## Export Functionality

### How to Export
1. Click the **"Export"** button in the FlowToolbar
2. Choose where to save the `.json` file
3. The file will be downloaded with the workflow name as filename

### What Gets Exported
The exported JSON file contains:
- **Workflow metadata**: Name, version, export timestamp
- **Workflow configuration**: All API keys and service settings
- **Flow structure**: All nodes and their configurations
- **Edge connections**: Including conditional logic and settings
- **Variables**: All extracted variables and their definitions

### Export File Structure
```json
{
  "name": "My Voice Agent Workflow",
  "version": "1.0.0",
  "config": {
    "twilio": { "accountSid": "...", "authToken": "...", ... },
    "llm": { "provider": "openai", "openAI": { ... } },
    "voice": { "provider": "eleven_labs", ... },
    "transcription": { "provider": "deepgram", ... },
    "globalSettings": { ... }
  },
  "nodes": [
    {
      "id": "node-1",
      "type": "startNode",
      "position": { "x": 100, "y": 100 },
      "data": { ... }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "data": { "type": "ai_based", "aiCondition": "..." }
    }
  ],
  "variables": [
    {
      "name": "customer_tier",
      "type": "string",
      "description": "Customer tier level",
      "nodeId": "node-2"
    }
  ],
  "exportedAt": "2024-01-15T10:30:00.000Z"
}
```

## Import Functionality

### How to Import
1. Click the **"Import"** button in the FlowToolbar
2. Select a `.json` file exported from the Flow Builder
3. Confirm the import if you have existing work
4. The workflow will be loaded with all configurations

### What Gets Imported
- **Complete workflow**: All nodes, edges, and configurations
- **API configurations**: Service settings and credentials
- **Conditional logic**: All edge conditions and variables
- **Workflow settings**: Global parameters and preferences

### Import Validation
The system validates:
- **File format**: Must be valid JSON
- **Data structure**: Must contain expected workflow properties
- **Node/Edge format**: Arrays with proper structure
- **Configuration validity**: Basic checks for required fields

### Import Behavior
- **Existing workflow**: Prompts for confirmation before replacing
- **Empty workspace**: Imports directly without confirmation
- **Error handling**: Shows specific error messages for invalid files
- **Success feedback**: Displays what was imported (nodes, edges, variables, config)

## Use Cases

### Backup and Restore
```
1. Export your workflow regularly as backup
2. Store exported files in version control
3. Import to restore previous versions
4. Share workflows between team members
```

### Template Creation
```
1. Create a base workflow template
2. Export the template
3. Import template for new projects
4. Customize for specific use cases
```

### Environment Migration
```
1. Export from development environment
2. Import to staging/production
3. Update API keys for target environment
4. Test and deploy
```

### Collaboration
```
1. Team member exports their workflow
2. Share the JSON file
3. Other team members import
4. Continue collaborative development
```

## Security Considerations

### API Keys in Exports
- **Included**: API keys are exported for complete workflow portability
- **Security**: Keep exported files secure and private
- **Sharing**: Remove sensitive data before sharing templates
- **Environment**: Update API keys when importing to different environments

### Best Practices
- **Version control**: Don't commit files with production API keys
- **Templates**: Create sanitized templates without real credentials
- **Access control**: Limit access to exported workflow files
- **Rotation**: Rotate API keys if files are compromised

## File Management

### Naming Convention
- Exported files use workflow name: `my_workflow.json`
- Spaces replaced with underscores
- Lowercase for consistency
- `.json` extension automatically added

### File Size
- **Typical size**: 10-100 KB for most workflows
- **Large workflows**: May reach 1-2 MB with many nodes
- **Compression**: Consider zipping for large files or sharing

### Compatibility
- **Forward compatible**: Newer versions can import older files
- **Backward compatible**: Older versions may not support new features
- **Version tracking**: Export includes version information

## Troubleshooting

### Common Import Errors

**"Invalid file format"**
- File is not valid JSON
- File is corrupted or incomplete
- Solution: Check file integrity, re-export if needed

**"File does not contain valid workflow data"**
- Missing required properties (nodes, edges, name)
- Wrong file type imported
- Solution: Ensure you're importing a workflow export file

**"Invalid nodes/edges data format"**
- Nodes or edges are not arrays
- Data structure corruption
- Solution: Check file structure, re-export from source

### Import Issues

**Missing nodes after import**
- Node types not supported in current version
- Custom components not available
- Solution: Update application or recreate missing nodes

**Broken connections**
- Edge references invalid node IDs
- Conditional logic not supported
- Solution: Manually reconnect nodes, update conditions

**Configuration errors**
- API keys invalid in target environment
- Service configurations incompatible
- Solution: Update configuration after import

### Performance Tips

**Large workflows**
- Import may take a few seconds
- Browser may show "not responding" briefly
- Wait for completion message

**Memory usage**
- Large workflows use more browser memory
- Close other tabs if experiencing issues
- Refresh browser if needed

## Future Enhancements

Planned improvements:
- **Selective import**: Choose which parts to import
- **Merge workflows**: Combine multiple workflow files
- **Template library**: Built-in template management
- **Version comparison**: Compare different workflow versions
- **Batch operations**: Import/export multiple workflows
- **Cloud sync**: Automatic backup to cloud storage
