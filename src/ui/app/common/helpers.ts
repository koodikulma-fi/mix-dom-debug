
// - Imports - //

import { classNames } from "dom-types";
import { MixDOM, MixDOMRenderOutput } from "mix-dom";


// - Wrap - //

export const wrapTip = (...contents: MixDOMRenderOutput[]) => 
    MixDOM.def("div", { class: classNames("style-ui-panel flex-col layout-gap-l"), style: "min-width: 100px;" }, ...contents);
