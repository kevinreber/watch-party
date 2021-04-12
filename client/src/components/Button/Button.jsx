import styled from 'styled-components';

const PRIMARY_COLOR = 'palevioletred';
const SECONDARY_COLOR = 'white';

const Button = styled.button`
	background: ${(props) => (props.primary ? PRIMARY_COLOR : SECONDARY_COLOR)};
	border-radius: 3px;
	border: 2px solid ${PRIMARY_COLOR};
	color: ${(props) => (props.primary ? SECONDARY_COLOR : PRIMARY_COLOR)};
	margin: 0.5em 1em;
	padding: 0.25em 1em;
	cursor: pointer;
	&:hover {
		background: ${(props) => (props.primary ? SECONDARY_COLOR : PRIMARY_COLOR)};
		color: ${(props) => (props.primary ? PRIMARY_COLOR : SECONDARY_COLOR)};
	}
`;

export default Button;
