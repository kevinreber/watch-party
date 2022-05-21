import React from 'react';

/** useFields handles the state of the form data */
const useFields = (INITIAL_STATE: any) => {
	const [formData, setFormData] = React.useState(INITIAL_STATE);

	/** Update state in formData */
	const handleChange = (e: any) => {
		const { name, value } = e.target;
		setFormData((fData: any) => ({
			...fData,
			[name]: value,
		}));
	};

	const resetFormData = () => setFormData(INITIAL_STATE);

	return [formData, handleChange, resetFormData];
};

export default useFields;
