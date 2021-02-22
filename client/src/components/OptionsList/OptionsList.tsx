interface OptionsTypes {
	videoId: string;
	channel: string;
	description: string;
	url: string;
	name: string;
	img: string;
}

interface OptionListTypes {
	options: OptionsTypes[];
}

const OptionsList = ({ options }: OptionListTypes): JSX.Element => {
	return (
		<ul>
			{options.length ? (
				options.map((option) => (
					<li>
						{option.name}
						{option.url}
						<img src={option.img} alt={option.name} />
					</li>
				))
			) : (
				<li>
					<em>No Matches</em>
				</li>
			)}
		</ul>
	);
};

export default OptionsList;
