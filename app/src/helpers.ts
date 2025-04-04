import { Label, Tag } from "konva/lib/shapes/Label"
import { Text } from "konva/lib/shapes/Text"
import { Line } from "konva/lib/shapes/Line"

class CustomSegmentMarker {
  constructor(options) {
    this._options = options
  }

  init(group) {
    this._group = group

    this._label = new Label({
      x: 0.5,
      y: 0.5
    })

    const color = this._options.segment.color

    this._tag = new Tag({
      fill: color,
      stroke: color,
      strokeWidth: 1,
      pointerDirection: "down",
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: "round",
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowOpacity: 0.3
    })

    this._label.add(this._tag)

    let labelText = this._options.segment.labelText

    if (labelText) {
      labelText += " "
    }

    labelText += this._options.startMarker ? "Start" : "End"

    this._text = new Text({
      text: labelText,
      fontFamily: "Calibri",
      fontSize: 14,
      padding: 5,
      fill: "white"
    })

    this._label.add(this._text)

    // Vertical Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Line({
      x: 0,
      y: 0,
      stroke: color,
      strokeWidth: 1
    })

    group.add(this._label)
    group.add(this._line)

    this.fitToView()
    this.bindEventHandlers()
  }

  bindEventHandlers = () => {
    this._group.on("mouseenter", () => {
      document.body.style.cursor = "move"
    })

    this._group.on("mouseleave", () => {
      document.body.style.cursor = "default"
    })
  }

  fitToView = () => {
    const height = this._options.layer.getHeight()

    const labelHeight = this._text.height() + 2 * this._text.padding()
    const offsetTop = 14
    const offsetBottom = 26

    this._group.y(offsetTop + labelHeight + 0.5)

    this._line.points([
      0.5,
      0,
      0.5,
      height - labelHeight - offsetTop - offsetBottom
    ])
  }
}

class SimplePointMarker {
  constructor(options) {
    this._options = options
  }

  init(group) {
    this._group = group

    // Vertical Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Line({
      x: 0,
      y: 0,
      stroke: this._options.color,
      strokeWidth: 1
    })

    group.add(this._line)
    this.fitToView()
  }

  fitToView = () => {
    const height = this._options.layer.getHeight()
    this._line.points([0.5, 0, 0.5, height])
  }
}

class CustomPointMarker {
  constructor(options) {
    this._options = options
  }

  init(group) {
    this._group = group

    this._label = new Label({
      x: 0.5,
      y: 0.5
    })

    this._tag = new Tag({
      fill: this._options.color,
      stroke: this._options.color,
      strokeWidth: 1,
      pointerDirection: "down",
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: "round",
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowOpacity: 0.3
    })

    this._label.add(this._tag)

    this._text = new Text({
      text: this._options.point.labelText,
      fontFamily: "Calibri",
      fontSize: 14,
      padding: 5,
      fill: "white"
    })

    this._label.add(this._text)

    // Vertical Line - create with default y and points, the real values
    // are set in fitToView().
    this._line = new Line({
      x: 0,
      y: 0,
      stroke: this._options.color,
      strokeWidth: 1
    })

    group.add(this._label)
    group.add(this._line)

    this.fitToView()
    this.bindEventHandlers()
  }

  bindEventHandlers = () => {
    this._group.on("mouseenter", () => {
      document.body.style.cursor = "move"
    })

    this._group.on("mouseleave", () => {
      document.body.style.cursor = "default"
    })
  }

  fitToView = () => {
    const height = this._options.layer.getHeight()

    const labelHeight = this._text.height() + 2 * this._text.padding()
    const offsetTop = 14
    const offsetBottom = 26

    this._group.y(offsetTop + labelHeight + 0.5)

    this._line.points([
      0.5,
      0,
      0.5,
      height - labelHeight - offsetTop - offsetBottom
    ])
  }
}

function createPointMarker(options) {
  if (options.view === "zoomview") {
    return new CustomPointMarker(options)
  } else {
    return new SimplePointMarker(options)
  }
}

function createSegmentMarker(options) {
  if (options.view === "zoomview") {
    return new CustomSegmentMarker(options)
  }

  return null
}

function createSegmentLabel(options) {
  if (options.view === "overview") {
    return null
  }

  const label = new Label({
    x: 12,
    y: 16
  })

  label.add(
    new Tag({
      fill: "black",
      pointerDirection: "none",
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowOpacity: 0.3
    })
  )

  label.add(
    new Text({
      text: options.segment.labelText,
      fontSize: 14,
      fontFamily: "Calibri",
      fill: "white",
      padding: 8
    })
  )

  return label
}

export { createPointMarker, createSegmentLabel, createSegmentMarker }
