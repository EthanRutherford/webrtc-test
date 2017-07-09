const {j, Controller, PropTypes: {required}} = require("jenny-js");

class Doodle extends Controller {
	init() {
		return j({div: 0}, [
			j({canvas: {
				onmousedown: this.onMouseDown.bind(this),
				height: 200,
				width: 200,
				style: "border: 1px solid black",
				ref: (ref) => this.canvas = ref,
			}}),
			j({br: 0}),
			j({button: {onclick: this.clear.bind(this)}}, ["clear"]),
		]);
	}
	didMount() {
		this.context = this.canvas.getContext("2d");
		const hue = ((this.props.id * 5) % 12) * 30;
		this.context.strokeStyle = `hsl(${hue}, 75%, 40%)`;
		this.context.lineWidth = 4;
		this.context.lineCap = "round";
		this.drawing = false;

		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		window.addEventListener("mousemove", this.onMouseMove);
		window.addEventListener("mouseup", this.onMouseUp);
	}
	didUnMount() {
		window.removeEventListener("mouseup", this.onMouseUp);
		window.removeEventListener("mousemove", this.onMouseMove);
	}
	onMouseDown(event) {
		event.preventDefault();
		this.drawing = true;
		const rect = this.canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		this.context.beginPath();
		this.context.moveTo(x, y);
		this.context.stroke();

		this.props.onChange(this.canvas.toDataURL());
	}
	onMouseMove(event) {
		if (this.drawing) {
			const rect = this.canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			this.context.lineTo(x, y);
			this.context.stroke();

			this.props.onChange(this.canvas.toDataURL());
		}
	}
	onMouseUp(event) {
		if (this.drawing) {
			this.drawing = false;
			const rect = this.canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			this.context.lineTo(x, y);
			this.context.stroke();
			this.context.closePath();

			this.props.onChange(this.canvas.toDataURL());
		}
	}
	clear() {
		const width = this.canvas.width;
		const height = this.canvas.height;
		this.context.clearRect(0, 0, width, height);

		this.props.onChange(this.canvas.toDataURL());
	}
	getXY(event) {
		const newX = event.clientX - this.canvas.offsetLeft;
		const newY = event.clientY - this.canvas.offsetTop;

		const result = {oldX: this.x, oldY: this.y, newX, newY};

		this.x = newX;
		this.y = newY;

		return result;
	}
}

Doodle.propTypes = {
	id: required(Number),
	onChange: required(Function),
};

module.exports = Doodle;
