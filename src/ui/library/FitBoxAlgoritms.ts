
// - INTERFACES - //

// General.
export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}
export type Align = { horizontal?: HAlign; vertical?: VAlign; };
export type Offset = { top?: number; left?: number; };
export type Margin = number | [number, number] | MarginSides;
export type Size = { width: number; height: number; };
export interface MarginSides {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}
export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "center" | "bottom";

export type FittingAlgoritm = "push" | "anchored";
export enum FitLocks {
    Left = 1 << 0,
    Top = 1 << 1,
    Right = 1 << 2,
    Bottom = 1 << 3,
    // Shortcuts.
    Horizontal = Left | Right,
    Vertical = Top | Bottom,
    None = 0,
    All = Horizontal | Vertical
}

export const cleanMargin = (margin: Margin | null | undefined) => {
    const cMargin = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    };
    if (typeof margin === "number")
        cMargin.top = cMargin.left = cMargin.bottom = cMargin.right = margin;
    else if (margin && margin.constructor === Array) {
        cMargin.left = cMargin.right = margin[0] || 0;
        cMargin.top = cMargin.bottom = margin[1] || 0;
    }
    else if (margin) {
        const m = margin as MarginSides;
        cMargin.left = m.left || 0;
        cMargin.right = m.right || 0;
        cMargin.top = m.top || 0;
        cMargin.bottom = m.bottom || 0;
    }
    return cMargin;
}

export class FitBoxAlgoritms {

    // Static fitting main method.
    static fitToSize(targetRect: Rect, containerRect: Rect, fitLocks: FitLocks = FitLocks.None, hAlgoritm: FittingAlgoritm = "push", vAlgoritm : FittingAlgoritm = "push"): Rect {

        // Prepare outcome.
        const newRect: Rect = { ...targetRect };

        // Resize and reposition horizontally.
        if ((fitLocks & FitLocks.Horizontal) !== FitLocks.Horizontal) {
            // Calc.
            let left = newRect.left;
            let width = newRect.width;
            if (hAlgoritm === "anchored")
                [left, width] = FitBoxAlgoritms.axisFitAnchored(newRect.left, newRect.width, containerRect.left, containerRect.width, !(fitLocks & FitLocks.Left), !(fitLocks & FitLocks.Right));
            else if (hAlgoritm === "push")
                [left, width] = FitBoxAlgoritms.axisFitPush(newRect.left, newRect.width, containerRect.left, containerRect.width);
            // Apply.
            newRect.left = left;
            newRect.width = width;
        }

        // Resize and reposition vertically.
        if ((fitLocks & FitLocks.Vertical) !== FitLocks.Vertical) {
            // Calc.
            let top = newRect.top;
            let height = newRect.height;
            if (vAlgoritm === "anchored")
                [top, height] = FitBoxAlgoritms.axisFitAnchored(newRect.top, newRect.height, containerRect.top, containerRect.height, !(fitLocks & FitLocks.Top), !(fitLocks & FitLocks.Bottom));
            else if (vAlgoritm === "push")
                [top, height] = FitBoxAlgoritms.axisFitPush(newRect.top, newRect.height, containerRect.top, containerRect.height);
            // Apply.
            newRect.top = top;
            newRect.height = height;
        }

        // Return new rect.
        return newRect;
    }

    // Static push-based fitting algoritm for one axis.
    static axisFitPush(tStart: number, tSize: number, cStart: number, cSize: number): [number, number] {
        // Squeeze to fit the container size.
        if (tSize > cSize)
            tSize = cSize;
        // Push towards the start.
        const tEnd = tStart + tSize;
        const cEnd = cStart + cSize;
        if (tEnd > cEnd)
            tStart -= tEnd - cEnd;
        // Push towards the end.
        if (tStart < cStart)
            tStart = cStart;
        // Return.
        return [tStart, tSize];
    }

    // Static anchor-lock-based fitting algoritm for one axis.
    static axisFitAnchored(tStart: number, tSize: number, cStart: number, cSize: number, allowStart = true, allowEnd = true): [number, number] {
        // Prepare.
        const cEnd = cStart + cSize;
        let startEdge = tStart;
        let endEdge = tStart + tSize;
        let leftOver = 0;
        // 1. Align the end side towards start (edge).
        if (allowEnd && (endEdge > cEnd)) {
            const newEdge = cEnd;
            leftOver = newEdge - endEdge;
            endEdge = newEdge;
        }
        // 2. Align the start side towards end (edge + leftover from end).
        if (allowStart && (startEdge + leftOver < cStart)) {
            const newEdge = cStart;
            leftOver = newEdge - (startEdge + leftOver);
            startEdge = newEdge;
        }
        // 3. Realign the end side towards start (edge + leftover from start).
        if (leftOver > 0 && allowEnd && (endEdge + leftOver > cEnd)) {
            endEdge = cEnd;
            leftOver = 0;
        }
        // Apply.
        return [startEdge, endEdge - startEdge];
    }
}
