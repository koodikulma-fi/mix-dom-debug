
// MAIN IDEA:
// - HOOK UP: We just hook up to the Host's update/render cycle.
//      * One idea is to actually mangle the static methods on HostServices.. though... not sure how "super" works then on static side.
//      * Anyway, would prefer "new HostDebug(host)", instead of requiring to use a HostDebug class _instead_ of Host.
//      * Finally, by default already opens up a new window, where the UI is renderered.
//          - Could even load up scripts externally.. from unpkg....?
//              * https://unpkg.com/mix-dom@4.0.0/MixDOM.module.js
//              * https://unpkg.com/mix-dom-debug@4.0.0/MixDOMDebug.module.js
//          - And so once have loaded, then starts rendering... !
// - UI-TREELIST: We essentially CONVERT EACH TREENODE IN THE GROUNDED TREE to an ITEM IN A TREE LIST.
//      * Basic expanding feature. Later add filtering to the tree.
//      * Aslo a button to console.log the component instance.
// - UI-DETAILS: When selects in TREELIST, then can view DETAILS for it.
//      * Includes the whole class, and thus props and state.
//      * This can later include modifying directly.
// - SPECIALS:
//      * Could have a MEMSHOT feature, to take a copy of properties of a component and store temporarily (with name).
//          - Then can PASTE properties to a component, or just for debugging.
