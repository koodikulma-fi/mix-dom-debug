
// - Imports - //

// Libraries.
import { MixDOM } from "mix-dom";


// - Component (spread) - //

// Default row renderer. Let's use spread, could use a full component, too. 
export interface UIVirtualRowProps {
	iRow: number;
	nRows: number;
	rowHeight: number;
}
export const UIVirtualRow = (props: UIVirtualRowProps) => {
	return (
		<div className="ui-virtual-row" style={{
			position: "absolute",
			top: (props.rowHeight * props.iRow) + "px",
			height: props.rowHeight,
			width: "100%"
		}}>
			{MixDOM.Content}
		</div>
	);
}
