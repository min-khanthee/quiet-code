import * as vscode from 'vscode';

/**
 * Merges overlapping or adjacent vscode.Range objects into consolidated ranges.
 */

export function mergeRanges(ranges: vscode.Range[]): vscode.Range[] {
    if (ranges.length === 0) return [];
  
    const sorted = [...ranges].sort((a, b) => a.start.compareTo(b.start));
    const merged: vscode.Range[] = [sorted[0]];
  
    for (const current of sorted.slice(1)) {
      const last = merged[merged.length - 1];
      if (last.end.isAfterOrEqual(current.start)) {
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

  /**
 * Adjusts the existing dimmed ranges based on the current selection.
 * If the selection is already dimmed, it will undim it (even partially).
 * If not dimmed, it will be added.
 */

  export function adjustDimForSelection(existing: vscode.Range[], selection: vscode.Selection): vscode.Range[] {
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