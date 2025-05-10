import * as vscode from 'vscode';
import { mergeRanges, adjustDimForSelection } from './helpers';
import { quietDimStyle } from './decoration';
import { getDims, setDims, clearDims, clearAllDims, getAllOpenEditors } from './dimState';

export function activate(context: vscode.ExtensionContext) {

  // // Reapply dim style to this file's saved dimmed ranges (e.g. after switching tabs).
  function applyDims(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
    const docUri = editor.document.uri.toString();
    const ranges = getDims(docUri);
    editor.setDecorations(quietDimStyle, ranges);
  }

// Dims selected lines if not dimmed, or undims them if already dimmed.
  const toggleDim = vscode.commands.registerCommand('quiet-code.toggleDim', () => {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return vscode.window.showInformationMessage('No active editor');
    }

    const docUri = editor.document.uri.toString();
    const selections = editor.selections.filter(sel => !sel.isEmpty);
    if (selections.length === 0) {
      return vscode.window.showInformationMessage('No text selected');
    }

    let updatedRanges = getDims(docUri);

    for (const selection of selections) {
      updatedRanges = adjustDimForSelection(updatedRanges, selection);
    }
    updatedRanges.sort((a, b) => a.start.compareTo(b.start));
    updatedRanges = mergeRanges(updatedRanges);
    setDims(docUri, updatedRanges);
    editor.setDecorations(quietDimStyle, updatedRanges);
  });

// Undims all lines in the active file and removes them from memory
  const clearDimsInFile = vscode.commands.registerCommand('quiet-code.clearDimsInFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return vscode.window.showInformationMessage('No active editor');
    }

    const docUri = editor.document.uri.toString();
    clearDims(docUri);
    editor.setDecorations(quietDimStyle, []);
  });

// Completely removes all dimmed lines across every file and editor window
  const clearAllDimsCommand = vscode.commands.registerCommand('quiet-code.clearAllDims', async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Clear all dims across all files?',
      { modal: true },
      'Yes'
    );
  
    if (confirm !== 'Yes') {
      return;
    }
    
    clearAllDims();
getAllOpenEditors().forEach(editor => {
  editor.setDecorations(quietDimStyle, []);
});
    vscode.window.showInformationMessage('All dims cleared across all files.');
  });

// Calls applyDims() whenever the user switches to a different editor
  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    applyDims(editor);
  });

// Apply dims on first activation (with slight delay to ensure editor is ready)
setTimeout(() => applyDims(vscode.window.activeTextEditor), 50);

  context.subscriptions.push(
    toggleDim,
    clearDimsInFile,
    clearAllDimsCommand,
    editorChangeDisposable
  );
}

export function deactivate() {}