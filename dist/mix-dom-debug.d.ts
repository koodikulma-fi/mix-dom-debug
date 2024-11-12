import * as mix_dom from 'mix-dom';
import { Host, MixDOMTreeNode, MixDOMTreeNodeType, MixDOMDefTarget, MixDOMTreeNodePass, SourceBoundary, ComponentRemoteType, MixDOMRenderOutput, ComponentTypeEither, Ref, ComponentWith, ComponentProps, ComponentFuncReturn, ComponentFunc, ComponentWiredFunc, MixDOMProps, Component, MixDOMTreeNodeBoundary, ComponentWiredType, ComponentRemote, ComponentCtxFunc } from 'mix-dom';
import { ClassType } from 'mixin-types';
import { Context } from 'data-signals';
import * as dom_types from 'dom-types';
import { CSSProperties, DOMTags, DOMElement } from 'dom-types';
import * as dom_types_camelCase from 'dom-types/camelCase';
import { HTMLAttributes } from 'dom-types/camelCase';
import { Host as Host$1, ComponentCtxFunc as ComponentCtxFunc$1 } from 'mix-dom/camelCase';

interface HostDebugSettings {
    /** Give an additional console to use for logging information. Will anyway log to the window where the debugger lives. */
    console: Console | null;
}
/** This type contains partial HostDebugSettings and a few initial settings only used on start up (rootElement and cssUrl). */
interface HostDebugSettingsInit extends Partial<HostDebugSettings> {
    /** App root element or selector. If null, creates an element with "app-root" id and puts it inside `document.body`. */
    rootElement?: string | Element | null;
    /** Url for loading up the css file for the app. Defaults to: https://unpkg.com/mix-dom-debug/MixDOMDebug.css */
    cssUrl?: string;
}
interface HostDebugAppState {
    theme: "dark" | "light";
    filter: string;
    showCollapsed: boolean;
    showParents: boolean;
    showChildren: boolean;
    hideUnmatched: boolean;
    ignoreSelection: boolean;
    ignoreFilter: boolean;
    /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
    rowMode: "select" | "select-tip" | "tip";
    hiddenTipSections: TipSectionNames[];
}
interface HostDebugAppStateUpdate extends Partial<HostDebugAppState> {
    selected?: _MixDOMTreeNode[];
    collapsed?: _MixDOMTreeNode[];
    includedSubHosts?: _Host[] | boolean;
}
type TipSectionNames = "heading" | "code" | "props" | "state" | "contexts" | "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders";
/** Simplified version of MixDOMTreeNode. */
interface _MixDOMTreeNode {
    type: "dom" | "portal" | "boundary" | "pass" | "host" | "root";
}
interface _Host {
    groundedTree: _MixDOMTreeNode;
}

type DebugContextData = {
    settings: HostDebugSettings & {};
    host: Host | null;
    iUpdate: number;
};
type DebugContextSignals = {
    domFocus: (treeNode: MixDOMTreeNode | null) => void;
};
type DebugContext = Context<DebugContextData, DebugContextSignals>;
type StateContextData = HostDebugAppState & {
    shouldSelect: boolean;
    noneCollapsed: boolean;
};
type StateContextSignals = {
    /** Handled by UIAppHostTree. */
    scrollToMatched: (toPrevious?: boolean, withinCollapsed?: boolean) => void;
    /** Handled by UIAppHostTree. */
    toggleCollapseAll: () => void;
    /** Handled by UIAppHostTree. */
    toggleSelectMatched: (includeRelated?: boolean) => void;
    /** Handled by UIAppHostTree. */
    setTipDisplay: (treeNode: MixDOMTreeNode | null) => void;
    /** Handled by UIAppHostTree. */
    modifySelected: (ids: MixDOMTreeNode[], mode: "reset" | "invert" | "add" | "remove") => void;
    /** Handled by UIAppHostTree. */
    modifyCollapsed: (ids: MixDOMTreeNode[], mode: "reset" | "invert" | "add" | "remove") => void;
    /** Handled by UIAppHostTree. */
    modifySubHosts: (hostsOrToggle: boolean | Host[]) => void;
    /** Handled by MixDOMDebug. */
    connectSubHost: (host: Host, refresh?: boolean) => void;
    /** Handled by MixDOMDebug. */
    disconnectSubHost: (host: Host, refresh?: boolean) => void;
    /** Handled by MixDOMDebug. */
    toggleTheme: () => void;
};
type StateContext = Context<StateContextData, StateContextSignals>;
type AppContexts = {
    debug: DebugContext;
    state: StateContext;
};
interface TreeListItem<Item extends TreeListItem = any> {
    children?: Item[];
}
type DebugTreeItemType = Exclude<MixDOMTreeNodeType, "boundary"> | "component" | "empty" | "dom-element" | "dom-text" | "dom-external" | "dom-pseudo";
interface DebugTreeItem extends TreeListItem<DebugTreeItem> {
    id: MixDOMTreeNode;
    treeNode: MixDOMTreeNode;
    parent: DebugTreeItem | null;
    level: number;
    /** Name of the component, or other naming. */
    name: string;
    /** One liner of the content. For example, for a DOM element, it's the element as code. For a component, it's the class/function as a string. Does not contain nested content. */
    description: string;
}
type IconNames = "" | "console" | "info" | "theme" | "close" | "back" | "forwards" | "expanded" | "collapsed" | "show-all" | "show-matched" | "scroll-to" | "select-all" | "select-none" | "no-selection" | "no-filter" | "click-select" | "click-select-tip" | "click-tip" | "filter" | "filter-collapsed" | "filter-expanded" | "filter-parents" | "filter-children" | "item-selected" | "item-deselected";

/** Current app version. */
declare const appVersion: "1.0.0";

declare const appIcons: Record<IconNames, MixDOMDefTarget | null>;

declare function getItemTypeFrom(treeNode: MixDOMTreeNode): DebugTreeItemType;
declare function getPassPhaseAndSource(treeNode: MixDOMTreeNodePass): [phrase: string, sBoundary: SourceBoundary | null];
declare function consoleLog(debugInfo: HostDebugSettings | null | undefined, ...args: any[]): void;
declare function consoleWarn(debugInfo: HostDebugSettings | null | undefined, ...args: any[]): void;
declare const consoleLogItem: (debugInfo: HostDebugSettings | null | undefined, item: DebugTreeItem) => void;
/** Helper to read array like properties from an object, optionally only certain kind of arrays. */
type ArrLikePropsOf<T extends Record<string, any>, Arr extends any[] = any[]> = {
    [Key in string & keyof T]: T[Key] extends Arr ? Key : never;
}[string & keyof T];
/** Helper to flatten a tree. */
declare function flattenTree<Item extends Partial<Record<ChildProp, Item[]>>, ChildProp extends string & ArrLikePropsOf<Item, Item[]>>(rootItems: Item[], childProp: ChildProp): Item[];
declare function flattenTree<Item extends Partial<Record<"children", Item[]>>>(rootItems: Item[], childProp?: "children"): Item[];
/** Helper to flatten a tree. */
declare function flattenTreeWith<Item extends Partial<Record<ChildProp, Item[]>>, FinalItem, ChildProp extends string & ArrLikePropsOf<Item, Item[]>, PItem extends FinalItem = FinalItem>(rootItems: Item[], itemHandler: (origItem: Item, parent: PItem | null, level: number, ignoreKids: () => void) => FinalItem | null, childProp: ChildProp): PItem[];
declare function flattenTreeWith<Item extends Partial<Record<"children", Item[]>>, FinalItem, PItem extends FinalItem = FinalItem>(rootItems: Item[], itemHandler: (origItem: Item, parent: PItem | null, level: number, ignoreKids: () => void) => FinalItem | null, childProp?: "children"): PItem[];

interface MixDOMDebugType extends ClassType<MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    debug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host: Host, settings?: Partial<HostDebugSettings>, state?: Partial<HostDebugAppState>) => MixDOMDebug;
}
declare class MixDOMDebug {
    ["constructor"]: MixDOMDebugType;
    /** Our own contexts. */
    contexts: AppContexts;
    /** Our own host. */
    ownHost: Host;
    /** For forcing refreshes. */
    refreshId: {};
    /** Updates are delayed by a timer. */
    updateTimer: number | null;
    constructor(container?: Element | null);
    setHost(host: Host, debugSettings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null): void;
    clearHost(): void;
    updateSettings(debugSettings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null): void;
    refresh(forceRefresh?: boolean): void;
    onUpdate: (cancelled?: boolean, host?: Host) => void;
    getSettings(settings?: Partial<HostDebugSettings> | null, includeCurrent?: boolean): HostDebugSettings;
    private clearHostListeners;
    private setHostListeners;
    /** Instance of the MixDOMDebug, once has started debugging. */
    static debug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    static stopDebug: (skipContext?: boolean) => void;
    /** Start debugging the given host and initialize the app (unless already inited). */
    static startDebug: (host?: Host | null, settings?: HostDebugSettingsInit | null, appState?: HostDebugAppStateUpdate | null) => MixDOMDebug;
    /** Should only be called once. Adds the css, scripts and a couple of DOM elements to set up the app.
     * @param cssUrl This is only used for the css file.
     * @param onLoad Called after loading the two optional auxiliary scripts.
     *      - "prettify" is used for syntax highlighting,
     *      - "beautify" is used for line breaks and tabs fos JS.
     *      - If the codes are not present, they are simply skipped. After loading, refresh the app to take use of them.
     */
    static initApp: (cssUrl?: string, onLoad?: () => void) => void;
}

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}
type Align = {
    horizontal?: HAlign;
    vertical?: VAlign;
};
type Offset = {
    top?: number;
    left?: number;
};
type Margin = number | [number, number] | MarginSides;
type Size = {
    width: number;
    height: number;
};
interface MarginSides {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
}
type HAlign = "left" | "center" | "right";
type VAlign = "top" | "center" | "bottom";
type FittingAlgoritm = "push" | "anchored";
declare enum FitLocks {
    Left = 1,
    Top = 2,
    Right = 4,
    Bottom = 8,
    Horizontal = 5,
    Vertical = 10,
    None = 0,
    All = 15
}
declare const cleanMargin: (margin: Margin | null | undefined) => {
    top: number;
    left: number;
    right: number;
    bottom: number;
};
declare class FitBoxAlgoritms {
    /** Fit to size main algorithm. */
    static fitToSize(targetRect: Rect, containerRect: Rect, fitLocks?: FitLocks, hAlgoritm?: FittingAlgoritm, vAlgoritm?: FittingAlgoritm): Rect;
    /** Push based fitting algorithm. */
    static axisFitPush(tStart: number, tSize: number, cStart: number, cSize: number): [number, number];
    /** Anchor-lock-based fitting algorithm. */
    static axisFitAnchored(tStart: number, tSize: number, cStart: number, cSize: number, allowStart?: boolean, allowEnd?: boolean): [number, number];
}

interface UIFitBoxProps {
    className?: string;
    style?: string | CSSProperties;
    lockHorizontal?: boolean;
    lockVertical?: boolean;
    margin?: Margin;
    offset?: Offset;
    align?: Align;
    getContainerRect?: () => Rect;
    onMaxSize?: (width: number, height: number) => void;
}
interface UIFitBoxState extends Rect {
}
interface UIFitBoxInfo {
    props: UIFitBoxProps;
    state: UIFitBoxState;
}
declare const UIFitBox: mix_dom.ComponentFunc<UIFitBoxInfo>;

interface UIPopupContentsAlignProps {
    horizontalAlign?: HAlign;
    verticalAlign?: VAlign;
    /** Margin from container rect. */
    containerMargin?: Margin;
    /** Margin from element (by getElement) if provided. */
    elementMargin?: Margin;
}
interface UIPopupContainerProps extends UIPopupContentsAlignProps {
    /** The element to hold the popup for a portal, or a remote component. */
    container?: Node | ComponentRemoteType | null;
    /** The source element that triggered the tooltip. Used for positioning and sizing. */
    sourceElement?: HTMLElement | null | (() => HTMLElement | null);
    contentClassName?: string;
    contentStyle?: string | CSSProperties;
    style?: string | CSSProperties;
}
declare const UIPopupContainer: (props: UIPopupContainerProps) => any;

interface UIPopupContentsProps extends UIPopupContentsAlignProps {
    getElement?: HTMLElement | null | (() => HTMLElement | null);
    getContainerRect?: () => Rect;
    className?: string;
    contentClassName?: string;
    contentStyle?: string | CSSProperties;
    hAlign?: HAlign;
    vAlign?: VAlign;
    /** Margin from container rect. */
    margin?: Margin;
    /** Margin from element (by getElement) if provided. */
    elementMargin?: Margin;
    style?: string | CSSProperties;
}
declare const UIPopupContents: mix_dom.ComponentFunc<{
    props: UIPopupContentsProps;
    state: {
        refreshId?: {};
    };
}>;

interface UIVirtualRowProps {
    iRow: number;
    nRows: number;
    rowHeight: number;
}
declare const UIVirtualRow: (props: UIVirtualRowProps) => any;

interface UIVirtualListInfo {
    props: {
        rowHeight: number;
        nRows: number;
        renderRow: (iRow: number, nRows: number, rowHeight: number) => MixDOMRenderOutput;
        autoWrap?: boolean;
        handleResizing?: boolean;
        rowTolerance?: number;
        className?: string;
        contentClassName?: string;
        style?: CSSProperties;
        contentStyle?: CSSProperties;
        refreshId?: any;
        getRowKey?: (iRow: number, nRows: number) => any;
    };
    state: {
        height: number;
        iStart: number;
        iEnd: number;
    };
    class: {
        getRootElement: () => HTMLElement | null;
        getListElement: () => HTMLElement | null;
        getFirstVisibleItem: (includeWithinMargin?: boolean) => HTMLElement | null;
        /** Get the virtual row element at the given iRow location. */
        getElementAt: (iRow: number) => HTMLElement | null;
        /** Note. Behavior defaults to "auto". However, if you're using the callback to get the elRow, you might want to use "instant" instead - otherwise it won't map correctly. */
        scrollToIndex: (iRow: number, behavior?: "auto" | "instant" | "smooth", onlyIfNeeded?: boolean, callback?: (elRow: HTMLElement | null) => void) => void;
    };
}
/** Row scroller component.
 * - Provides very simple virtual scrolling feature based on fixed row height.
 * - Utilizes native behaviour directly, simply uses overflow "auto" on the parent.
 * 		* And to force the height uses "padding-bottom" on the scrollable content.
 * - Elements are not given as children, but rendered when needed by index.
 * 		* And each is positioned accordingly (with position: absolute).
 * - Uses resizeObserver as well as onScroll listeners to check if should refresh.
 */
declare const UIVirtualList: mix_dom.ComponentFunc<UIVirtualListInfo>;

interface UIListInfo<Item extends any = any, CommonProps extends Record<string, any> = {}> {
    props: {
        className?: string;
        listClassName?: string;
        Item: ComponentTypeEither<{
            props: {
                item: Item;
            } & CommonProps;
        }>;
        items: Item[];
        keyProp?: keyof Item & string;
        rowHeight?: number;
        /** Note that if used, uses it as a refreshId for UIVirtualList as well. */
        commonProps?: CommonProps;
        filter?: (item: Item, iTotal: number, nIncluded: number) => boolean;
        refreshId?: any;
        refVirtualList?: Ref<ComponentWith<UIVirtualListInfo>>;
    };
}
declare function UIList<Item extends any = any, CommonProps extends Record<string, any> = {}>(_initProps: ComponentProps<UIListInfo<Item, CommonProps>>, comp: ComponentWith<UIListInfo<Item, CommonProps>>): ComponentFuncReturn<UIListInfo>;

interface MixOnEscapeInfo {
    class: {
        useEscape(enabled: boolean): void;
    };
    signals: {
        onEscape(): void;
    };
}
declare const MixOnEscape: ComponentFunc<MixOnEscapeInfo>;

interface MixHoverSignalInfo {
    signals: {
        onHover(isHovered: boolean): void;
    };
    class: {
        /** Hover ref. This should be assigned to the desired element (single). */
        hoverRef: Ref<HTMLElement>;
        /** Only used on mouse enter: if disabled, won't trigger timer -> set state. */
        hoverDisabled?: boolean | "one-time";
        /** Timeout before the tip is triggered. Defaults to 600. */
        hoverTimeout: number;
    };
    timers: "onMouseEnter" | string & {};
}
/** Provides hover feature. Renderer should assign comp.hoverRef to the element. */
declare const MixHoverSignal: ComponentFunc<MixHoverSignalInfo>;

interface MixPositionedPopupInfo {
    state: UIPopupContentsAlignProps & {
        popupOpened: boolean | "start" | "in" | "out";
        popupFadeIn?: number;
        popupFadeOut?: number;
        popupSourceElement?: HTMLElement | null;
    };
    class: {
        /** To insert the content. */
        WithTooltip: ComponentWiredFunc;
        /** This should be assigned to provide the popup content. */
        renderPopup?(): MixDOMRenderOutput;
        /** Use externally to indicate reason to re-render the popup's contents (including UIPopupContainer -> UIPopupContents -> UIFitBox). */
        refreshPopupId?: any;
        /** Feature to show a popup. */
        showPopup(byElement?: HTMLElement | null, instantly?: boolean): void;
        /** Feature to hide a popup, if opened. */
        hidePopup(): void;
        /** Where to insert the popup. Internally defaults to document.body */
        popupContainer?: HTMLElement | ComponentRemoteType | null;
    };
    timers: "popupFade" | string & {};
}
/** Provides popup feature with auto positioning. Renderer should include <comp.WithTooltip/>. */
declare const MixPositionedPopup: ComponentFunc<MixPositionedPopupInfo>;

declare const wrapTip: (...contents: MixDOMRenderOutput[]) => mix_dom.MixDOMDefTarget | null;

interface UIAppIconProps extends Omit<MixDOMProps<"span">, "class"> {
    iconName: IconNames;
    iconSize?: "small" | "normal" | "large";
}
declare function UIAppIcon(props: UIAppIconProps): MixDOMRenderOutput;

declare const UIAppTipRemote: mix_dom.ComponentRemoteType<{}>;
interface UIAppTipOwnProps<Tag extends DOMTags = "div"> {
    tag: Tag;
    rootRef?: Ref<DOMElement<Tag>> | null;
    escToCloseTip?: boolean;
    /** Defaults to true. */
    clickToCloseTip?: boolean;
    getPositionSource?: (source: HTMLElement | null) => HTMLElement | null;
    /** Provide the tip here. Can be any render output, or alternatively a function: (tipComponent) => output. */
    renderTip?: MixDOMRenderOutput | ((uiAppTipComponent: Component<UIAppTipInfo>) => MixDOMRenderOutput);
    disableHover?: boolean;
    className?: string;
    refreshId?: any;
}
interface UIAppTipOwnInfo<Tag extends DOMTags = "div"> {
    props: UIAppTipOwnProps<Tag> & MixDOMProps<Tag, "camelCase">;
    class: {
        setHovered: (isHovered: boolean) => void;
    };
}
type UIAppTipInfo<Tag extends DOMTags = "div"> = MixOnEscapeInfo & MixHoverSignalInfo & MixPositionedPopupInfo & UIAppTipOwnInfo<Tag>;
/** Simple button with hovertip. */
declare const UIAppTip: <Tag extends DOMTags = "div">(initProps: mix_dom.MixDOMInternalCompProps<{
    onEscape(): void;
} & {
    onHover(isHovered: boolean): void;
}> & UIAppTipOwnProps<Tag> & ([DOMTags] extends [Tag] ? dom_types.DOMAttributesAny_camelCase : dom_types.DOMAttributes_camelCase<Tag, dom_types.DOMAttributesAny_camelCase>) & Omit<HTMLAttributes<Tag, Partial<dom_types_camelCase.HTMLCommonAttributes & dom_types.HTMLGlobalAttributes_camelCase & dom_types.GlobalListeners_camelCase & dom_types.ARIAAttributes_camelCase>>, "class">, comp: ComponentWith<UIAppTipInfo<Tag>>) => ComponentFuncReturn<UIAppTipInfo<Tag>>;

type UIAppButtonProps = Omit<UIAppTipInfo<"button">["props"], "tag"> & {
    iconName?: IconNames;
    iconClassName?: string;
    toggled?: boolean;
    invisible?: boolean;
    look?: "filled" | "edge" | "transparent";
    size?: "no" | "narrow" | "large";
    /** Use this for onClick with modifier key support. */
    onPress?: (e: MouseEvent | KeyboardEvent) => void;
};
/** Simple button with hovertip. */
declare const UIAppButton: ComponentFunc<{
    props: UIAppButtonProps;
}>;

type UIAppInputProps = Omit<UIAppTipInfo<"input">["props"], "tag"> & {
    look?: "filled" | "edge" | "transparent";
    escToClearInput?: boolean;
    onValue?: (newValue: string) => void;
};
/** Simple input with hovertip. */
declare const UIAppInput: ComponentFunc<{
    props: UIAppInputProps;
}>;

declare function stringifyObject(object: any, multiLine?: boolean, nDepth?: number): string;
declare const Prettify: (props: {
    code: string;
    tag?: "pre" | "code";
    className?: string;
    style?: string | CSSProperties;
}) => mix_dom.MixDOMDefTarget | null;
interface PrettifyDelayInfo {
    state: {
        isReady?: boolean;
    };
    props: {
        origCode: string;
        tag?: "pre" | "code";
        className?: string;
        style?: string | CSSProperties;
        /** Defaults to 100ms. Only used from initial props, or when resetId or origCode indicates a reset. */
        delay?: number;
        prePrettifier?: (str: string) => string;
        resetId?: any;
    };
    timers: "reset";
}
declare const PrettifyDelay: ComponentFunc<PrettifyDelayInfo>;
/** Only escapes if prettify is present. */
declare function escapeHTML(html: string): string;
declare function beautify(text: string): string;
declare function getSnippetContainerProps(): {
    className: string;
    style: string;
};
declare function getMiniScrollableProps(extraClassName?: string): {
    className: string;
    style?: string;
};

type OnItemLink = (id: DebugTreeItem["id"] | null, mode?: "focus" | "details" | "details-only" | "details-break" | "log") => void;
declare function getGroundingTreeNode(treeNode: MixDOMTreeNode): MixDOMTreeNodeBoundary | MixDOMTreeNodePass | null;
declare function readComponentOneLine(treeNode: MixDOMTreeNodeBoundary | MixDOMTreeNodePass, onPress?: ((e: MouseEvent | KeyboardEvent) => void) | null, skipContentStartStr?: boolean): MixDOMRenderOutput;
declare function ComponentLink(props: {
    name: string;
    onPress?: (e: MouseEvent | KeyboardEvent) => void;
    className?: string;
}): any;
declare function RenderComponentPartList(props: {
    component: Component;
    part: "props" | "state" | "contexts";
}): any;
declare function RenderPartList<Key extends string = string>(props: {
    portion: Partial<Record<Key, any>>;
    keys?: Key[];
    overrideText?: string;
}): any;
declare function RenderPropertyName(props: {
    italic?: boolean;
    bold?: boolean;
}): any;
declare function RenderComponentWiredChildren(props: {
    wired: Set<ComponentWiredType | ComponentWiredFunc>;
    onItemLink?: OnItemLink;
}): any;
declare function RenderComponentRemoteChildren(props: {
    remote: ComponentRemote;
    remotePasses?: MixDOMTreeNodePass[];
    onItemLink?: OnItemLink;
}): any;
declare function RenderComponentChildren(props: {
    treeNode: MixDOMTreeNodeBoundary | MixDOMTreeNodePass;
    onItemLink?: OnItemLink;
}): any;
declare const RenderedByComponents: ComponentFunc<{
    props: {
        treeNode: MixDOMTreeNode;
        iUpdate?: number;
        onItemLink?: OnItemLink;
    };
}>;

declare const renderComponentLinkTip: () => mix_dom.MixDOMDefTarget | null;
interface UIAppTipSectionInfo {
    props: {
        type: Exclude<TipSectionNames, "heading">;
        title: MixDOMRenderOutput;
        extraTitle?: MixDOMRenderOutput;
        afterTitle?: MixDOMRenderOutput;
        /** If gives extraTitle or afterTitle defaults to true. Otherwise false. */
        useOverflow?: boolean;
        /** If provided with onItemLink, then wraps extraTitle or title as a scroll-to-link. */
        idToScroll?: DebugTreeItem["id"];
        onItemLink?: OnItemLink;
        /** Defaults to true. */
        useDefaultLimits?: boolean;
        /** Used for logging the debugTarget. */
        debugInfo?: HostDebugSettings | null;
        /** Info to log into console. */
        debugTarget?: Record<string, any>;
    };
    state: {
        hiddenSections: TipSectionNames[];
    };
    contexts: AppContexts;
}
declare const UIAppTipSection: ComponentFunc<UIAppTipSectionInfo>;
interface UIAppTipHeadingInfo {
    props: {
        title: MixDOMRenderOutput;
        extraTitle?: MixDOMRenderOutput;
        afterTitle?: MixDOMRenderOutput;
        afterLogTitle?: MixDOMRenderOutput;
        afterLogTarget?: object | null;
        /** If gives extraTitle or afterTitle defaults to true. Otherwise false. */
        useOverflow?: boolean;
        /** If provided with onItemLink, then wraps extraTitle or title as a scroll-to-link. */
        idToScroll?: DebugTreeItem["id"];
        onItemLink?: OnItemLink;
        /** Needed for afterLogTarget. */
        debugInfo?: HostDebugSettings;
        /** Defaults to true. */
        useDefaultLimits?: boolean;
        history?: DebugTreeItem[];
        iHistory?: number;
        onHistory?: (iTo: number) => void;
    };
    contexts: AppContexts;
}
declare const UIAppTipHeading: ComponentFunc<UIAppTipHeadingInfo>;

interface UIAppTipDisplayInfo {
    props: {
        item: DebugTreeItem;
        debugInfo?: HostDebugSettings | null;
        iUpdate?: number;
        onItemLink?: OnItemLink;
        reselectRefreshId?: any;
        escToCloseTip?: boolean;
        onHistoryItem?: (item: DebugTreeItem) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
        includedSubHosts?: Host[];
        includeAllHosts?: boolean;
        toggleSubHost?: (host: Host, included?: boolean | null | "mode") => void;
    };
    state: {
        isAlive: boolean;
        history: DebugTreeItem[];
        iHistory: number;
    };
    class: {
        onHistory: (iTo: number) => void;
    };
    timers: "alive";
}
declare const UIAppTipDisplay: ComponentFunc<UIAppTipDisplayInfo>;

interface UIAppShowTipInfo {
    props: {
        item: DebugTreeItem | null;
        iUpdate?: number;
        onItemLink?: OnItemLink;
        getSourceElement?: (treeNode?: DebugTreeItem["id"]) => HTMLElement | null;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        includedSubHosts?: Host[];
        includeAllHosts?: boolean;
        toggleSubHost?: (host: Host, included?: boolean | null | "mode") => void;
        debugInfo?: HostDebugSettings | null;
        popupContainerProps?: Omit<UIPopupContainerProps, "container" | "sourceElement">;
        reselectRefreshId?: any;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
    };
    state: {
        item: DebugTreeItem | null;
    };
}
declare const UIAppShowTip: mix_dom.ComponentFunc<UIAppShowTipInfo & MixPositionedPopupInfo>;

interface UITreeNodeTypeInfo {
    props: {
        item: DebugTreeItem;
        iUpdate?: number;
        className?: string;
        displayClassName?: string;
        conceptClassName?: string;
        onSelectItem?: (e: MouseEvent | KeyboardEvent) => void;
        onSelectConcept?: (e: MouseEvent | KeyboardEvent) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        onToggleTip?: (e: MouseEvent | KeyboardEvent) => void;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
    };
}
declare const UITreeNodeType: ComponentFunc<UITreeNodeTypeInfo>;

interface UIAppTreeItemInfo {
    props: {
        item: DebugTreeItem;
        iUpdate?: number;
        animate?: boolean;
        debugInfo?: HostDebugSettings | null;
        /** Use this to set the collapsed state (for the collapse button), if null, then cannot collapse. */
        collapsed?: boolean | null;
        selected?: boolean | null;
        dimmed?: boolean;
        toggleCollapsed?: (item: DebugTreeItem, mode?: "level" | "siblings" | "parents" | "chain" | "reset" | "self") => void;
        toggleSelected?: (item: DebugTreeItem, mode?: "level" | "siblings" | "parents" | "chain" | "reset" | "self") => void;
        toggleConcept?: (concept: DebugTreeItemType, reset?: boolean) => void;
        onToggleTip?: (id: DebugTreeItem["id"]) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
    };
    state: {
        animFinished?: true;
    };
}
declare function UIAppTreeItem(_initProps: ComponentProps<UIAppTreeItemInfo>, comp: Component<UIAppTreeItemInfo>): ComponentFuncReturn<UIAppTreeItemInfo>;

type SectionNames = "instructions" | "set-host" | "using-launcher" | "manual-launching" | "render-app";
interface UIAppInstructionsInfo {
    props: {
        refreshId?: any;
    };
    state: {
        hiddenSections: SectionNames[];
    };
}
declare const UIAppInstructions: ComponentFunc<UIAppInstructionsInfo>;

type Item$1 = UIAppTreeItemInfo["props"]["item"];
interface UIAppHostTreeInfo {
    props: {
        refreshId?: any;
        className?: string;
        listClassName?: string;
        style?: CSSProperties;
    };
    state: {
        host: Host | null;
        settings: HostDebugSettings | null;
        iUpdate: number;
        selected: Item$1["id"][];
        collapsed: Item$1["id"][];
        tipItem: Item$1 | null;
        filterSplits: string[][] | null;
        showCollapsed: boolean;
        showParents: boolean;
        showChildren: boolean;
        ignoreSelection: boolean;
        ignoreFilter: boolean;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode: "select" | "select-tip" | "tip";
        hideUnmatched: boolean;
        includeAllSubHosts: boolean;
        includedSubHosts: Host[];
        reselectRefreshId: {};
    };
    class: {
        /** Used in scroll-to-matched feature. */
        iMatchCycle: number;
    };
    contexts: AppContexts;
    timers: "tip-hover" | "skip-hover";
}
declare const UIAppHostTree: ComponentCtxFunc<UIAppHostTreeInfo>;

interface UIAppTopBarInfo {
    props: {
        refreshId?: any;
    };
    state: Omit<StateContextData, "hiddenTipSections">;
    contexts: AppContexts;
}
declare const UIAppTopBar: ComponentCtxFunc<UIAppTopBarInfo>;

interface UIAppInfo {
    props: {
        refreshId?: any;
    };
    state: {
        theme: "dark" | "light";
        host: Host$1 | null;
    };
    contexts: AppContexts;
}
declare const UIApp: ComponentCtxFunc$1<UIAppInfo>;

export { Align, AppContexts, ArrLikePropsOf, ComponentLink, DebugContext, DebugContextData, DebugContextSignals, DebugTreeItem, DebugTreeItemType, FitBoxAlgoritms, FitLocks, FittingAlgoritm, HAlign, IconNames, Margin, MarginSides, MixDOMDebug, MixDOMDebugType, MixHoverSignal, MixHoverSignalInfo, MixOnEscape, MixOnEscapeInfo, MixPositionedPopup, MixPositionedPopupInfo, Offset, OnItemLink, Prettify, PrettifyDelay, PrettifyDelayInfo, Rect, RenderComponentChildren, RenderComponentPartList, RenderComponentRemoteChildren, RenderComponentWiredChildren, RenderPartList, RenderPropertyName, RenderedByComponents, SectionNames, Size, StateContext, StateContextData, StateContextSignals, TreeListItem, UIApp, UIAppButton, UIAppButtonProps, UIAppHostTree, UIAppHostTreeInfo, UIAppIcon, UIAppIconProps, UIAppInfo, UIAppInput, UIAppInputProps, UIAppInstructions, UIAppInstructionsInfo, UIAppShowTip, UIAppShowTipInfo, UIAppTip, UIAppTipDisplay, UIAppTipDisplayInfo, UIAppTipHeading, UIAppTipHeadingInfo, UIAppTipInfo, UIAppTipRemote, UIAppTipSection, UIAppTipSectionInfo, UIAppTopBar, UIAppTopBarInfo, UIAppTreeItem, UIAppTreeItemInfo, UIFitBox, UIFitBoxInfo, UIFitBoxProps, UIList, UIListInfo, UIPopupContainer, UIPopupContainerProps, UIPopupContents, UIPopupContentsAlignProps, UIPopupContentsProps, UITreeNodeType, UITreeNodeTypeInfo, UIVirtualList, UIVirtualListInfo, UIVirtualRow, UIVirtualRowProps, VAlign, appIcons, appVersion, beautify, cleanMargin, consoleLog, consoleLogItem, consoleWarn, escapeHTML, flattenTree, flattenTreeWith, getGroundingTreeNode, getItemTypeFrom, getMiniScrollableProps, getPassPhaseAndSource, getSnippetContainerProps, readComponentOneLine, renderComponentLinkTip, stringifyObject, wrapTip };
