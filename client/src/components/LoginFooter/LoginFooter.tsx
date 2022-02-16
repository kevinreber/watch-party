// dependencies
import React, { FormEvent } from 'react';
import 'emoji-mart/css/emoji-mart.css';

// hooks
import useFields from '../../hooks/useFields';

/** MUI */
import { Button } from '@material-ui/core';
import { TextField } from '@mui/material';

const isValid = (data: string) => {
	return data && data.trim() !== '';
};

interface LoginTypes {
	login: Function;
	username: String;
}

const LoginFooter = ({ login, username }: LoginTypes): JSX.Element => {
	const [formData, handleChange, resetFormData] = useFields({ username });

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		// Check if field is empty or white space
		if (!isValid(formData.username)) return;

		login(formData.username);
		resetFormData();
	};

	return (
		<>
			<form onSubmit={handleSubmit}>
				<TextField
					name="username"
					onChange={handleChange}
					value={formData.username}
					type="text"
					placeholder="Create Username"
					size="small"
					required
				/>
				{/* @ts-ignore */}
				<Button type="submit" disabled={!formData.username} variant="contained">
					Submit
				</Button>
			</form>
		</>
	);
};

export default LoginFooter;
