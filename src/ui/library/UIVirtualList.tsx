
// - Imports - //

// Libaries.
import { createDataTrigger, numberRange, areEqual } from "data-memo";
import { classNames, CSSProperties } from "dom-types";
import { MixDOM, Ref, MixDOMRenderOutput, ComponentWith } from "mix-dom";
// Local.
import { UIVirtualRow } from "./UIVirtualRow";
import { SignalListenerFlags } from "data-signals";


// - Component - //

// Interfaces.
export interface UIVirtualListInfo {
	props: {
		rowHeight: number; // In pixels.
		nRows: number;
		renderRow: (iRow: number, nRows: number, rowHeight: number) => MixDOMRenderOutput;
		autoWrap?: boolean;
		handleResizing?: boolean;
		rowTolerance?: number; // How many extra rows shows (above and below). Defaults to 2.0.
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
export const UIVirtualList = MixDOM.component<UIVirtualListInfo>((component) => {

	// Prepare state and ref.
	component.state = {
		height: 0,
		iStart: -1,
		iEnd: -1
	};
	const containerRef = new Ref<HTMLDivElement>();


	// - Features - //

	// Callbacks.
	let onNextRefresh: ((willUpdate: boolean) => void) | undefined = undefined;
	component.scrollToIndex = (iRow, behavior, onlyIfNeeded, callback) => {
		// Get.
		const elScroller = containerRef.getElement();
		if (!elScroller)
			return;
        // Prepare callback handling.
		if (callback) {
			onNextRefresh = (willUpdate) => {
				// When finished.
				const finishOff = () => callback(component.getElementAt(iRow));
				// Set listener or trigger instantly.
				willUpdate ? component.listenTo("didUpdate", finishOff, null, SignalListenerFlags.OneShot) : finishOff();
			}
		}
		// Get scrolling position.
		const scrollTopWas = elScroller.scrollTop;
		const scrollTop = iRow * component.props.rowHeight;
		// Scroll, if should.
		if (!onlyIfNeeded || scrollTop < scrollTopWas || scrollTop + component.props.rowHeight > scrollTopWas + elScroller.clientHeight)
        	elScroller.scrollTo({ top: scrollTop, behavior: behavior || "auto" as any }); // Note. There's some weirdness about typing "behavior".
		// Call back instantly - there will be no scroll event fired, since there was no change.
		if (scrollTopWas === elScroller.scrollTop && onNextRefresh) {
			onNextRefresh(false);
			onNextRefresh = undefined;
		}
	};


	// - Element getters - //

	component.getRootElement = () => {
		return containerRef.getElement();
	};

	component.getListElement = () => {
		return containerRef.getElement()?.querySelector(".list-content") || null;
	};

	component.getElementAt = (iRow) => {
		return containerRef.getElement()?.querySelectorAll(".list-content .ui-virtual-row")[iRow - component.getRenderedState().iStart] as HTMLElement | undefined || null;
	};

	component.getFirstVisibleItem = (includeWithinMargin) => {
		const container = containerRef.getElement();
		const elRows = container && container.querySelectorAll(".list-content .ui-virtual-row");
		if (!elRows)
			return null;
		const scrollTop = container.scrollTop;
		return includeWithinMargin ? elRows[0] as HTMLElement | undefined || null : ([...elRows] as HTMLElement[]).find(elRow => elRow.offsetTop >= scrollTop) || null;
	};


	// - Upon resizing - //

	// Handle resizing - we want the anchor the scrolling during resizing.
	// .. Otherwise it feels like we're scrolling all over the place.
	// .. Let's implement this as a toggleable feature by using createDataTrigger.
	const onResize = createDataTrigger<boolean>(() => {

		// Create observer and attach to domDidMount.
		let observer: ResizeObserver | null = null;
		const mountResizer = (domNode: HTMLElement) => {
			observer = new ResizeObserver(onRefresh);
			observer.observe(domNode);
			component.setState({ height: domNode.offsetHeight });
			onRefresh();
		};
		containerRef.listenTo("domDidMount", mountResizer);

		// On unmount.
		const unmountResizer = () => {
			// Remove callbacks.
			containerRef.unlistenTo("domDidMount", mountResizer);
			containerRef.unlistenTo("domWillUnmount", unmountResizer);
			// Disconnect observer.
			if (observer)
				observer.disconnect();
			// Clear flags.
			observer = null;
		};
		containerRef.listenTo("domWillUnmount", unmountResizer);

		// Return unmountResizer - will be run if removed.
		return unmountResizer;
	});


	// - Refresh - //

	// Core method for refreshing.
	const onRefresh = () => {
		// Figure out.
		const container = containerRef.getElement();
		const scrollTop = container?.scrollTop || 0;
		const nTolerance = component.props.rowTolerance !== undefined ? component.props.rowTolerance : 2;
		const height = container?.offsetHeight || 0;
		const iMax = component.props.nRows - 1;
		const iStart = Math.min(Math.max(
			0,
			Math.floor(scrollTop / component.props.rowHeight - nTolerance)
		), iMax);
		const iEnd = Math.min(Math.floor(
			(scrollTop + height) / component.props.rowHeight + nTolerance
		), iMax);
		// Update - we use shallow check already here, to stop the flow early.
		// .. Even if we didn't, it still wouldn't re-render due to default settings.
		const newState = { iStart, iEnd, height };
		const doUpdate = !areEqual(newState, component.state, 1);
		// Internal hook.
		if (onNextRefresh) {
			onNextRefresh(doUpdate);
			onNextRefresh = undefined;
		}
		// Set the updates.
		if (doUpdate)
			component.setState(newState);
	}

	// Another data trigger. Let's hook it up to onRefresh above.
	const onRowsChanged = createDataTrigger<[ number, number, number | undefined, any ]>(
		onRefresh,
		[ component.props.rowHeight, component.props.nRows, component.props.rowTolerance, component.props.refreshId ]
	);

	const onScroll = onRefresh;


	// - Rendering - //

	// Return renderer.
	return (props, state) => {

		// Run the effect - to enable / disable resizing.
		onResize(props.handleResizing !== false);

		// Recheck on every render if related props have changed.
		// .. For state, we don't need to check.
		// .. It only changes if props change or on resize / scrolling (both handled).
		onRowsChanged([props.rowHeight, props.nRows, props.rowTolerance, props.refreshId]);

		// Render rows by callback.
		const nRows = props.nRows;
		const rows: MixDOMRenderOutput[] = numberRange(state.iStart, state.iEnd + 1).map(iRow => {
			// Call to render the row - if empty, don't render anything.
			// .. Importantly we use the _key prop to define how pairing should work.
			// .. Since we're dealing within a portion of a list, we can just use our iRow.
			let rowContent = props.renderRow(iRow, nRows, props.rowHeight);
			return rowContent && props.autoWrap !== false ?
				<UIVirtualRow
					iRow={iRow}
					nRows={nRows}
					rowHeight={props.rowHeight}
					_key={props.getRowKey ? props.getRowKey(iRow, nRows) : iRow}
				>
					{rowContent}
				</UIVirtualRow>
				: rowContent;
		});

		// Render the whole thing.
		return (
			<div
				_ref={containerRef}
				className={classNames("ui-virtual-list layout-scrollable style-scrollable layout-fit-height", props.className)}
				style={{
					// overflow: "auto",
					display: "flex",
					flexDirection: "column",
					...(props.style || {})
				}}
				onScroll={onScroll}
			>
				<div
					className={classNames("list-content", props.contentClassName)}
					style={{
						position: "relative",
						paddingBottom: (nRows * props.rowHeight) + "px",
						...(props.contentStyle || { })
					}}
				>
					{rows}
				</div>
			</div>
		);
	}
});
