// dependencies
import React, { FormEvent } from 'react';
import 'emoji-mart/css/emoji-mart.css';

// hooks
import useFields from '../../hooks/useFields';

/** MUI */
import { Button } from '@material-ui/core';

const INITIAL_STATE = {
	username: '',
};

const isValid = (data: string) => {
	return data && data.trim() !== '';
};

interface LoginTypes {
	login: Function;
}

const LoginFooter = ({ login }: LoginTypes): JSX.Element => {
	const [formData, handleChange, resetFormData] = useFields(INITIAL_STATE);

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
				<input
					name="username"
					onChange={handleChange}
					value={formData.username}
					type="text"
					placeholder="Create Username"
					required={true}
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
