import ReactDOM from 'react-dom';
import './Modal.css';

interface ModalTypes {
	children: any;
	onDismiss: Function;
}

const Modal = ({ children, onDismiss }: ModalTypes): JSX.Element => {
	return ReactDOM.createPortal(
		<div
			className="Modal"
			// @ts-ignore
			onClick={onDismiss}>
			<div className="Modal-Content" onClick={(e) => e.stopPropagation()}>
				{children}
			</div>
		</div>,
		// @ts-ignore
		document.getElementById('modal')
	);
};

export default Modal;
