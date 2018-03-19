import BaseSprite from './basesprite'

import {attr, memoize} from './decorators'
import {parseColorString, getLinearGradients} from './utils'

const measureText = memoize((node, text, font, lineHeight = '') => {
  const ctx = node.layer.outputContext
  let height = font.trim().match(/^\d+/)
  height = height != null ? Number(height[0]) + 2 : 0
  ctx.save()
  ctx.font = font
  let width
  try {
    width = ctx.measureText(text).width
  } catch (ex) {
    width = height * text.length
  }

  ctx.restore()
  return [width, Math.max(height, lineHeight)]
})

function calculTextboxSize(node, text, font, lineHeight) {
  const lines = text.split(/\n/)
  let width = 0,
    height = 0

  lines.forEach((line) => {
    const [w, h] = measureText(node, line, font, lineHeight)
    width = Math.max(width, w)
    height += h
  })

  return [width, height]
}

class LabelSpriteAttr extends BaseSprite.Attr {
  constructor(subject) {
    super(subject)
    this.merge({
      font: '16px Arial',
      textAlign: 'left',
      color: parseColorString('black'),
      lineHeight: '',
      renderMode: 'fill',
      text: '',
      textboxSize: [0, 0],
    })
  }

  @attr('repaint')
  set text(val) {
    val = String(val)
    this.set('textboxSize', [0, 0])
    this.set('text', val)
  }
  get text() {
    return this.get('text')
  }

  @attr
  set textboxSize(val) {
    return this.set('textboxSize', val)
  }
  get textboxSize() {
    return this.get('textboxSize')
  }

  @attr('repaint')
  set font(val) {
    this.set('textboxSize', [0, 0])
    this.set('font', val)
  }
  get font() {
    return this.get('font')
  }

  @attr('repaint')
  set lineHeight(val) {
    this.set('textboxSize', [0, 0])
    this.set('lineHeight', val)
  }
  get lineHeight() {
    return this.get('lineHeight')
  }

  @attr('repaint')
  set textAlign(val) {
    this.set('textAlign', val)
  }
  get textAlign() {
    return this.get('textAlign')
  }

  @attr('repaint')
  set renderMode(val) {
    this.set('renderMode', val)
  }
  get renderMode() {
    return this.get('renderMode')
  }

  @attr('repaint')
  set color(val) {
    this.set('color', parseColorString(val))
  }
  get color() {
    return this.get('color')
  }
}

class Label extends BaseSprite {
  static Attr = LabelSpriteAttr

  constructor(text, opts) {
    super(opts)
    this.text = String(text)
  }

  set text(val) {
    this.attr('text', val)
  }
  get text() {
    return this.attr('text')
  }

  // override to adapt content size
  get contentSize() {
    const [width, height] = this.attr('size')

    const boxSize = this.attr('textboxSize')
    if(boxSize[0] !== 0 || boxSize[1] !== 0) {
      return boxSize
    }
    if(width === '' || height === '') {
      const size = calculTextboxSize(this, this.text, this.attr('font'), this.attr('lineHeight'))
      this.attr('textboxSize', size)
      return size
    }

    return [width, height]
  }

  render(t, drawingContext) {
    const context = super.render(t, drawingContext),
      attr = this.attr(),
      text = this.text,
      font = attr.font,
      renderMode = attr.renderMode

    if(text) {
      context.font = attr.font
      const color = attr.color
      const lines = this.text.split(/\n/)

      context.textBaseline = 'top'

      const align = attr.textAlign,
        [width, height] = this.contentSize

      context.strokeStyle = context.fillStyle = color
      context.textBaseline = 'middle'

      const [borderWidth] = this.attr('border')

      const linearGradients = attr.linearGradients

      if(linearGradients && linearGradients.text) {
        const rect = linearGradients.text.rect || [borderWidth, borderWidth,
          width, height]

        context.strokeStyle = context.fillStyle
          = getLinearGradients(context, rect, linearGradients.text)
      }

      let top = borderWidth

      lines.forEach((line) => {
        let left = borderWidth
        const [w, h] = measureText(this, line, font, attr.lineHeight)

        if(align === 'center') {
          left += (width - w) / 2
        } else if(align === 'right') {
          left += width - w
        }

        if(renderMode === 'fill') {
          context.fillText(line, left, top + h / 2)
        } else {
          context.strokeText(line, left, top + h / 2)
        }

        top += h
      })
    }

    return context
  }
}

export default Label
