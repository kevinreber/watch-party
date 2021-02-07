// dependencies
import React, { FormEvent } from 'react';

// hooks
import useFields from '../../hooks/useFields';

/** MUI */
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';

const INITIAL_STATE = {
	content: '',
};

const isValid = (data: string) => {
	return data && data.trim() !== '';
};

interface MessageTypes {
	sendMessage: Function;
}

const MessageFooter = ({ sendMessage }: MessageTypes): JSX.Element => {
	const [formData, handleChange, resetFormData] = useFields(INITIAL_STATE);

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		// Check if field is empty or white space
		if (!isValid(formData.content)) return;

		sendMessage(formData);
		resetFormData();
	};

	return (
		<>
			<form onSubmit={handleSubmit}>
				<input
					name="content"
					onChange={handleChange}
					value={formData.content}
					type="text"
					placeholder="Type message here..."
					required={true}
				/>
				{/* @ts-ignore */}
				<IconButton
					type="submit"
					disabled={!formData.content}
					variant="contained">
					<SendIcon />
				</IconButton>
			</form>
		</>
	);
};

export default MessageFooter;
