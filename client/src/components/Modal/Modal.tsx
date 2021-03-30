import ReactDOM from 'react-dom';
import './Modal.css';

interface ModalTypes {
	content: any;
	onDismiss: Function;
}

const Modal = ({ content, onDismiss }: ModalTypes): JSX.Element => {
	return ReactDOM.createPortal(
		<div
			className="Modal"
			// @ts-ignore
			onClick={onDismiss}>
			<div className="Modal-Content" onClick={(e) => e.stopPropagation()}>
				{content}
			</div>
		</div>,
		// @ts-ignore
		document.getElementById('modal')
	);
};

export default Modal;
