// dependencies
import React, { useState, FormEvent } from 'react';
import 'emoji-mart/css/emoji-mart.css';
import { Picker } from 'emoji-mart';

// hooks
import useFields from '../../hooks/useFields';

/** MUI */
import IconButton from '@material-ui/core/IconButton';
import { TextField } from '@mui/material';
import {
	Send as SendIcon,
	InsertEmoticon as InsertEmoticonIcon,
} from '@material-ui/icons';

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
	const [showEmojis, setShowEmojis] = useState(false);

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		// Check if field is empty or white space
		if (!isValid(formData.content)) return;

		sendMessage(formData);
		resetFormData();
	};

	const toggleShowEmojis = (): void => setShowEmojis(!showEmojis);

	// reformat emoji event to handleChange()
	const handleEmoji = (emoji: any) => {
		const event = {
			target: {
				name: 'content',
				value: formData.content + emoji.native,
			},
		};
		handleChange(event);
	};

	return (
		<>
			<form onSubmit={handleSubmit}>
				<TextField
					name="content"
					onChange={handleChange}
					value={formData.content}
					type="text"
					placeholder="Type message here..."
					size="small"
					required
				/>
				{/* @ts-ignore */}
				<IconButton
					type="submit"
					disabled={!formData.content}
					variant="contained">
					<SendIcon />
				</IconButton>
				<IconButton type="button" onClick={toggleShowEmojis}>
					<InsertEmoticonIcon />
				</IconButton>
				{showEmojis && (
					<Picker onSelect={handleEmoji} native={true} theme="auto" />
				)}
				{/* <Picker onSelect={handleEmoji} set="google" /> */}
				{/* <Picker title="Pick your emoji…" emoji="point_up" />
				<Picker
					style={{ position: 'absolute', bottom: '20px', right: '20px' }}
				/>
				<Picker
					i18n={{
						search: 'Recherche',
						categories: { search: 'Résultats de recherche', recent: 'Récents' },
					}}
				/> */}
			</form>
		</>
	);
};

export default MessageFooter;
