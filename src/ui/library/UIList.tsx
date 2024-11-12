
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, ComponentWith, ComponentTypeEither, ComponentProps, ComponentFuncReturn, MixDOMRenderOutput, Ref } from "mix-dom";
import { createMemo } from "data-memo";
// Local.
import { UIVirtualList, UIVirtualListInfo } from "./UIVirtualList";


// - Component - //

export interface UIListInfo<Item extends any = any, CommonProps extends Record<string, any> = {}> {
    props: {
        className?: string;
        listClassName?: string;
        Item: ComponentTypeEither<{ props: { item: Item; } & CommonProps; }>;
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
export function UIList<Item extends any = any, CommonProps extends Record<string, any> = {}>(_initProps: ComponentProps<UIListInfo<Item, CommonProps>>, comp: ComponentWith<UIListInfo<Item, CommonProps>>): ComponentFuncReturn<UIListInfo> {

    // Memos.
    const getRefreshId = createMemo((...args: any[]) => ({}));
    const getItems = createMemo((items: Item[], filter?: (item: Item, iTotal: number, nIncluded: number) => boolean, ...args: any[]): Item[] => {
        let nIncluded = 0;
        return filter ? items.filter((item, i) => filter(item, i, nIncluded) ? ++nIncluded : false) : items.slice();
    });
    let items = getItems(comp.props.items, comp.props.filter, comp.props.refreshId);

    // Render row.
    const renderRow = (iRow: number, nRows: number, rowHeight: number): MixDOMRenderOutput => {
        const props = comp.props;
        const item = items[iRow];
        return item ? <props.Item _key={props.keyProp ? item[props.keyProp] : item} item={item} {...props.commonProps as CommonProps} ></props.Item> : null;
    };
    const getRowKey = (iRow: number) => comp.props.keyProp && comp.props.items[iRow] ? comp.props.items[iRow][comp.props.keyProp] : iRow;

    // Render.
    return ((props, state) => {
        items = getItems(props.items, props.filter, props.refreshId);
        return <div class={classNames("ui-tree-list flex-col layout-fit-size", props.className)} role="tree">
            <UIVirtualList _ref={props.refVirtualList} nRows={items.length} getRowKey={getRowKey} rowHeight={props.rowHeight ?? 30} renderRow={renderRow} refreshId={getRefreshId(items, props.commonProps, props.refreshId)} className={props.listClassName} />
        </div>;
    });
};
