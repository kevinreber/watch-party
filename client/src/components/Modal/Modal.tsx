import ReactDOM from 'react-dom';

interface ModalTypes {
	children: any;
	onDismiss: Function;
}

const Modal = ({ children, onDismiss }: ModalTypes): JSX.Element => {
	return ReactDOM.createPortal(
		<div
			className="Modal"
			// @ts-ignore
			onClick={onDismiss}
			style={{ backgroundColor: 'black', padding: '3rem', color: 'white' }}>
			<div className="Modal-Content" onClick={(e) => e.stopPropagation()}>
				{children}
			</div>
		</div>,
		// @ts-ignore
		document.getElementById('modal')
	);
};

export default Modal;
