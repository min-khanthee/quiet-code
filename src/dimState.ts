import * as vscode from 'vscode';

const dimmedSelections = new Map<string, vscode.Range[]>();

export function getDims(docUri: string): vscode.Range[] {
    return dimmedSelections.get(docUri) || [];
  }
  
  export function setDims(docUri: string, ranges: vscode.Range[]) {
    dimmedSelections.set(docUri, ranges);
  }
  
  export function clearDims(docUri: string) {
    dimmedSelections.delete(docUri);
  }
  
  export function clearAllDims() {
    dimmedSelections.clear();
  }
  
  export function getAllOpenEditors(): readonly vscode.TextEditor[] {
    return vscode.window.visibleTextEditors;
  }