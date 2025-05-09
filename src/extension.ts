import * as vscode from 'vscode';

const dimmedSelections = new Map<string, vscode.Range[]>();
const quietDimStyle = vscode.window.createTextEditorDecorationType({
  opacity: '0.2',
});

export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 Quiet Code extension activated");



function mergeRanges(ranges: vscode.Range[]): vscode.Range[] {
    if (ranges.length === 0) return [];

    const sorted = [...ranges].sort((a, b) => a.start.compareTo(b.start));
    const merged: vscode.Range[] = [sorted[0]];

    for (const current of sorted.slice(1)) {
      const last = merged[merged.length - 1];
      if (last.end.isAfterOrEqual(current.start)) {
        // Merge overlapping or adjacent
        const newRange = new vscode.Range(
          last.start,
          last.end.isAfter(current.end) ? last.end : current.end
        );
        merged[merged.length - 1] = newRange;
      } else {
        merged.push(current);
      }
    }

    return merged;
  }


  function adjustDimForSelection(existing: vscode.Range[], selection: vscode.Selection): vscode.Range[] {
    let wasUndimmed = false;
    const newRanges: vscode.Range[] = [];

    for (const range of existing) {
      if (range.contains(selection)) {
        if (!range.isEqual(selection)) {
          if (range.start.isBefore(selection.start)) {
            newRanges.push(new vscode.Range(range.start, selection.start));
          }
          if (range.end.isAfter(selection.end)) {
            newRanges.push(new vscode.Range(selection.end, range.end));
          }
        }
        wasUndimmed = true;
      } else {
        newRanges.push(range);
      }
    }

    if (!wasUndimmed) {
      newRanges.push(selection);
    }

    return newRanges;
  }




  function applyDims(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
    const docUri = editor.document.uri.toString();
    const ranges = dimmedSelections.get(docUri) || [];
    editor.setDecorations(quietDimStyle, ranges);
  }

// Register command: Toggle Dim
  const toggleDim = vscode.commands.registerCommand('quiet-code.toggleDim', () => {
    console.log('Keybinding triggered: toggleDim');
    
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return vscode.window.showInformationMessage('No active editor');
    }

    const docUri = editor.document.uri.toString();
    const selections = editor.selections.filter(sel => !sel.isEmpty);
    if (selections.length === 0) {
      return vscode.window.showInformationMessage('No text selected');
    }

    const existingRanges = dimmedSelections.get(docUri) || [];
    let updatedRanges = existingRanges;

    for (const selection of selections) {
      updatedRanges = adjustDimForSelection(updatedRanges, selection);
    }
    updatedRanges.sort((a, b) => a.start.compareTo(b.start));
    updatedRanges = mergeRanges(updatedRanges);
    dimmedSelections.set(docUri, updatedRanges);
    editor.setDecorations(quietDimStyle, updatedRanges);
  });

  // Register command: Clear Dims in Current File
  const clearDimsInFile = vscode.commands.registerCommand('quiet-code.clearDimsInFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return vscode.window.showInformationMessage('No active editor');
    }

    const docUri = editor.document.uri.toString();
    dimmedSelections.delete(docUri);
    editor.setDecorations(quietDimStyle, []);
  });

  // Register command: Clear All Dims
  const clearAllDims = vscode.commands.registerCommand('quiet-code.clearAllDims', async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Clear all dims across all files?',
      { modal: true },
      'Yes'
    );
  
    if (confirm !== 'Yes') {
      return;
    }
    
    dimmedSelections.clear();
    vscode.window.visibleTextEditors.forEach(editor => {
      editor.setDecorations(quietDimStyle, []);
    });
    vscode.window.showInformationMessage('All dims cleared across all files.');
  });

  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    applyDims(editor);
  });

// Apply dims on first activation (with slight delay to ensure editor is ready)
setTimeout(() => applyDims(vscode.window.activeTextEditor), 50);

  context.subscriptions.push(
    toggleDim,
    clearDimsInFile,
    clearAllDims,
    editorChangeDisposable
  );
}

export function deactivate() {}