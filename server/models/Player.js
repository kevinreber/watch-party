class Player {
	constructor(room = null) {
		this.room = room;
		//  'PAUSE' || 'PLAY'
		this.state = null;
		this.time = null;
	}

	updateState = (state) => {
		this.state = state;
	};

	updateTime = (time) => {
		this.time = time;
	};
}
