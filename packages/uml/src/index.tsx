import React, { useRef, useEffect, useState, createRef } from 'react'
import { useSvgPan } from './hooks/useSvgPan'

import { IUmlUserConfig, UmlDataArray } from '@tuml/types'
import { StyleConfig } from './config'

import ArrowMaker from './components/ArrowMaker'

interface IProps {
  data?: UmlDataArray
  config?: IUmlUserConfig
}

type TRef = React.RefObject<SVGRectElement>
interface IRef {
  [property: string]: {
    [property: string]: TRef
  }
}

interface IPos {
  start: {
    x: number
    y: number
  }
  ca: {
    x: number
    y: number
  }
  cb: {
    x: number
    y: number
  }
  end: {
    x: number
    y: number
  }
}

type TLinePos = Array<IPos>

export default function Uml({ data = [], config }: IProps) {
  const [linePos, setLinePos] = useState<TLinePos>()
  const [div, matrix] = useSvgPan()
  const unitRef = useRef(setupUnitRef(data))
  const {
    lineStyle: { color },
    blockStyle: {
      hGap,
      width,
      height,
      content: { padding, backgroundColor },
      border: { width: borderWidth }
    }
  } = new StyleConfig(config).getConfig()

  // excute once mounted
  useEffect(() => {
    const computedLinePos = computeLinePos(data)
    setLinePos([...computedLinePos])
  }, data)

  function setupUnitRef(data: UmlDataArray) {
    const unitRef: IRef = {}
    data.forEach(d => {
      unitRef[d.name] = {}
      // TODO: what if d.members is empty?
      for (const id of d.members || []) {
        unitRef[d.name][id.name] = createRef()
      }
    })
    return unitRef
  }

  function computeLinePos(data: UmlDataArray): TLinePos {
    const computedLinePos: TLinePos = []
    data.forEach(d => {
      if (d.deps) {
        for (const k in d.deps) {
          d.deps[k].forEach(dep => {
            const self = unitRef.current[d.name][k].current
            const target = unitRef.current[dep.name][dep.id].current
            if (
              self &&
              target &&
              Reflect.get(self, 'getBBox') &&
              Reflect.get(target, 'getBBox')
            ) {
              const { x: sx, y: sy, width: sw, height: sh } = self.getBBox()
              const { x: tx, y: ty, height: th } = target.getBBox()
              if (tx >= sx + sw) {
                const offset: number = (tx - sx - sw) / 2
                const pos: IPos = {
                  start: {
                    x: sx + sw,
                    y: sy + sh / 2
                  },
                  ca: {
                    x: sx + sw + offset,
                    y: sy + sh / 2
                  },
                  cb: {
                    x: tx - offset,
                    y: ty + th / 2
                  },
                  end: {
                    x: tx,
                    y: ty + th / 2
                  }
                }
                computedLinePos.push(pos)
              } else throw Error('in reverse direction')
            }
          })
        }
      }
    })

    return computedLinePos
  }

  return (
    <div ref={div} style={{ width: '100%' }}>
      <svg width="100%">
        <ArrowMaker config={config} />

        <g
          transform={`matrix(${matrix[0]},${matrix[1]},${matrix[2]},${matrix[3]},${matrix[4]},${matrix[5]})`}
        >
          {data.map((d, dIdx) => {
            return (
              d.members &&
              d.members.map((k, kIdx) => {
                return (
                  <g key={`${d.name}-${k.name}`}>
                    <rect
                      ref={unitRef.current[d.name][k.name]}
                      x={dIdx * hGap}
                      y={0 + kIdx * (height + borderWidth)}
                      width={width}
                      height={height}
                      fill={backgroundColor}
                    />
                    <text>
                      <tspan
                        x={dIdx * hGap + padding}
                        y={
                          0 + kIdx * (height + borderWidth) + (height - padding)
                        }
                      >
                        {k.name}
                      </tspan>
                    </text>
                  </g>
                )
              })
            )
          })}
          {linePos &&
            linePos.map((l, idx) => {
              return (
                <g key={`l-${idx}`}>
                  <path
                    d={`
                M${l.start.x},${l.start.y} 
                C${l.ca.x},${l.ca.y} ${l.cb.x},${l.cb.y} 
                ${l.end.x},${l.end.y}
              `}
                    markerEnd="url(#arrow)"
                    stroke={color}
                    strokeDasharray="4 2"
                    fill="none"
                  />
                </g>
              )
            })}
        </g>
      </svg>
    </div>
  )
}
