'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

const standardMaterials = {
  'ASTM A36 Structural Steel': {
    yieldStrength: 250,
    elasticModulus: 200,
    density: 7850,
    poissonsRatio: 0.3,
    thermalExpansion: 12,
  },
  'ASTM A992 Structural Steel': {
    yieldStrength: 345,
    elasticModulus: 200,
    density: 7850,
    poissonsRatio: 0.3,
    thermalExpansion: 12,
  },
  'ASTM A572 Grade 50 Steel': {
    yieldStrength: 345,
    elasticModulus: 200,
    density: 7850,
    poissonsRatio: 0.3,
    thermalExpansion: 12,
  },
  'Custom': {
    yieldStrength: 0,
    elasticModulus: 0,
    density: 0,
    poissonsRatio: 0,
    thermalExpansion: 0,
  },
}

export function BeamLoadCalculatorComponent() {
  const [beamType, setBeamType] = useState('Simple Beam')
  const [beamLength, setBeamLength] = useState(1000)
  const [leftSupport, setLeftSupport] = useState(0)
  const [rightSupport, setRightSupport] = useState(1000)
  const [loadType, setLoadType] = useState('Point Load')
  const [loadMagnitude, setLoadMagnitude] = useState(1000)
  const [loadStartPosition, setLoadStartPosition] = useState(500)
  const [loadEndPosition, setLoadEndPosition] = useState(500)
  const [shearForceData, setShearForceData] = useState([])
  const [bendingMomentData, setBendingMomentData] = useState([])
  const [material, setMaterial] = useState('ASTM A36 Structural Steel')
  const [customMaterial, setCustomMaterial] = useState({...standardMaterials['Custom']})
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(200)
  const [results, setResults] = useState({
    maxShearForce: 0,
    maxBendingMoment: 0,
    maxNormalStress: 0,
    maxShearStress: 0,
    safetyFactor: 0,
  })

  useEffect(() => {
    calculateResults()
  }, [beamType, beamLength, leftSupport, rightSupport, loadType, loadMagnitude, loadStartPosition, loadEndPosition, material, customMaterial, width, height])

  const calculateResults = () => {
    const newShearForceData = []
    const newBendingMomentData = []
    let maxShearForce = 0
    let maxBendingMoment = 0

    if (beamType === 'Simple Beam') {
      if (loadType === 'Point Load') {
        const a = loadStartPosition - leftSupport
        const b = rightSupport - loadStartPosition
        const L = rightSupport - leftSupport

        const reactionA = (loadMagnitude * b) / L
        const reactionB = (loadMagnitude * a) / L

        for (let x = 0; x <= L; x += L / 100) {
          let shearForce = reactionA
          if (x > a) shearForce -= loadMagnitude

          let bendingMoment = reactionA * x
          if (x > a) bendingMoment -= loadMagnitude * (x - a)

          newShearForceData.push({ x: Number(x.toFixed(2)), shearForce: Number(shearForce.toFixed(2)) })
          newBendingMomentData.push({ x: Number(x.toFixed(2)), bendingMoment: Number(bendingMoment.toFixed(2)) })

          maxShearForce = Math.max(maxShearForce, Math.abs(shearForce))
          maxBendingMoment = Math.max(maxBendingMoment, Math.abs(bendingMoment))
        }
      } else if (loadType === 'Uniform Load') {
        const L = rightSupport - leftSupport
        const loadLength = loadEndPosition - loadStartPosition
        const w = loadMagnitude / loadLength // Load per unit length

        for (let x = 0; x <= L; x += L / 100) {
          let shearForce = 0
          let bendingMoment = 0

          if (x < loadStartPosition) {
            shearForce = (w * loadLength * (L - loadStartPosition - loadLength / 2)) / L
            bendingMoment = shearForce * x
          } else if (x >= loadStartPosition && x <= loadEndPosition) {
            shearForce = (w * loadLength * (L - loadStartPosition - loadLength / 2)) / L - w * (x - loadStartPosition)
            bendingMoment = (w * loadLength * (L - loadStartPosition - loadLength / 2) * x) / L - (w * (x - loadStartPosition) ** 2) / 2
          } else {
            shearForce = -(w * loadLength * (loadStartPosition + loadLength / 2)) / L
            bendingMoment = (w * loadLength * (loadStartPosition + loadLength / 2) * (L - x)) / L
          }

          newShearForceData.push({ x: Number(x.toFixed(2)), shearForce: Number(shearForce.toFixed(2)) })
          newBendingMomentData.push({ x: Number(x.toFixed(2)), bendingMoment: Number(bendingMoment.toFixed(2)) })

          maxShearForce = Math.max(maxShearForce, Math.abs(shearForce))
          maxBendingMoment = Math.max(maxBendingMoment, Math.abs(bendingMoment))
        }
      }
    } else if (beamType === 'Cantilever Beam') {
      if (loadType === 'Point Load') {
        for (let x = 0; x <= beamLength; x += beamLength / 100) {
          const shearForce = x <= loadStartPosition ? loadMagnitude : 0
          const bendingMoment = x <= loadStartPosition ? loadMagnitude * (loadStartPosition - x) : 0

          newShearForceData.push({ x: Number(x.toFixed(2)), shearForce: Number(shearForce.toFixed(2)) })
          newBendingMomentData.push({ x: Number(x.toFixed(2)), bendingMoment: Number(bendingMoment.toFixed(2)) })

          maxShearForce = Math.max(maxShearForce, Math.abs(shearForce))
          maxBendingMoment = Math.max(maxBendingMoment, Math.abs(bendingMoment))
        }
      } else if (loadType === 'Uniform Load') {
        const loadLength = loadEndPosition - loadStartPosition
        const w = loadMagnitude / loadLength // Load per unit length

        for (let x = 0; x <= beamLength; x += beamLength / 100) {
          let shearForce = 0
          let bendingMoment = 0

          if (x <= loadStartPosition) {
            shearForce = w * loadLength
            bendingMoment = w * loadLength * (loadStartPosition + loadLength / 2 - x)
          } else if (x > loadStartPosition && x <= loadEndPosition) {
            shearForce = w * (loadEndPosition - x)
            bendingMoment = (w * (loadEndPosition - x) ** 2) / 2
          }

          newShearForceData.push({ x: Number(x.toFixed(2)), shearForce: Number(shearForce.toFixed(2)) })
          newBendingMomentData.push({ x: Number(x.toFixed(2)), bendingMoment: Number(bendingMoment.toFixed(2)) })

          maxShearForce = Math.max(maxShearForce, Math.abs(shearForce))
          maxBendingMoment = Math.max(maxBendingMoment, Math.abs(bendingMoment))
        }
      }
    }

    setShearForceData(newShearForceData)
    setBendingMomentData(newBendingMomentData)

    const materialProps = material === 'Custom' ? customMaterial : standardMaterials[material]
    const area = width * height
    const momentOfInertia = (width * Math.pow(height, 3)) / 12
    const maxNormalStress = (maxBendingMoment * (height / 2)) / momentOfInertia
    const maxShearStress = (1.5 * maxShearForce) / area

    setResults({
      maxShearForce: Number(maxShearForce.toFixed(2)),
      maxBendingMoment: Number(maxBendingMoment.toFixed(2)),
      maxNormalStress: Number(maxNormalStress.toFixed(2)),
      maxShearStress: Number(maxShearStress.toFixed(2)),
      safetyFactor: Number((materialProps.yieldStrength / maxNormalStress).toFixed(2)),
    })
  }

  const BeamDiagram = () => {
    const svgWidth = 600
    const svgHeight = 200
    const margin = 40
    const beamY = svgHeight / 2
    const arrowSize = 20
    const supportSize = 30

    const leftSupportX = margin + (leftSupport / beamLength) * (svgWidth - 2 * margin)
    const rightSupportX = margin + (rightSupport / beamLength) * (svgWidth - 2 * margin)

    const loadStartX = margin + (loadStartPosition / beamLength) * (svgWidth - 2 * margin)
    const loadEndX = margin + (loadEndPosition / beamLength) * (svgWidth - 2 * margin)

    return (
      <svg width={svgWidth} height={svgHeight} className="mx-auto">
        {/* Beam */}
        <line
          x1={margin}
          y1={beamY}
          x2={svgWidth - margin}
          y2={beamY}
          stroke="black"
          strokeWidth="4"
        />

        {/* Left Support */}
        <polygon
          points={`${leftSupportX},${beamY} ${leftSupportX - supportSize / 2},${
            beamY + supportSize
          } ${leftSupportX + supportSize / 2},${beamY + supportSize}`}
          fill="none"
          stroke="black"
          strokeWidth="2"
        />

        {/* Right Support */}
        <polygon
          points={`${rightSupportX},${beamY} ${rightSupportX - supportSize / 2},${
            beamY + supportSize
          } ${rightSupportX + supportSize / 2},${beamY + supportSize}`}
          fill="none"
          stroke="black"
          strokeWidth="2"
        />

        {/* Load Arrow(s) */}
        {loadType === 'Point Load' ? (
          <line
            x1={loadStartX}
            y1={beamY - 60}
            x2={loadStartX}
            y2={beamY}
            stroke="red"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        ) : (
          <>
            <line
              x1={loadStartX}
              y1={beamY - 40}
              x2={loadEndX}
              y2={beamY - 40}
              stroke="red"
              strokeWidth="2"
            />
            {Array.from({ length: 5 }).map((_, index) => {
              const x = loadStartX + ((loadEndX - loadStartX) / 4) * index
              return (
                <line
                  key={index}
                  x1={x}
                  y1={beamY - 40}
                  x2={x}
                  y2={beamY}
                  stroke="red"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              )
            })}
          </>
        )}

        {/* Arrow definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="red" />
          </marker>
        </defs>

        {/* Labels */}
        <text x={margin} y={beamY + supportSize + 20} textAnchor="middle" fontSize="12">
          0
        </text>
        <text x={svgWidth - margin} y={beamY + supportSize + 20} textAnchor="middle" fontSize="12">
          {beamLength}
        </text>
        <text x={(loadStartX + loadEndX) / 2} y={beamY - 70} textAnchor="middle" fontSize="12" fill="red">
          {loadMagnitude.toFixed(2)} N
        </text>
        <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="12">
          Beam Length: {beamLength} mm
        </text>
      </svg>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
          />
        </svg>
        Beam Load Calculator
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Beam Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="beamType">Beam Type</Label>
                <Select value={beamType} onValueChange={setBeamType}>
                  <SelectTrigger id="beamType">
                    <SelectValue placeholder="Select beam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple Beam">Simple Beam</SelectItem>
                    <SelectItem value="Cantilever Beam">Cantilever Beam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="beamLength">Beam Length (mm)</Label>
                <Input
                  id="beamLength"
                  type="number"
                  value={beamLength}
                  onChange={(e) => setBeamLength(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="material">Material</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger id="material">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(standardMaterials).map((mat) => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {material === 'Custom' && (
                <div className="space-y-2">
                  <Label>Custom Material Properties</Label>
                  <Input
                    type="number"
                    placeholder="Yield Strength (MPa)"
                    value={customMaterial.yieldStrength}
                    onChange={(e) => setCustomMaterial({...customMaterial, yieldStrength: Number(e.target.value)})}
                  />
                  <Input
                    type="number"
                    placeholder="Elastic Modulus (GPa)"
                    value={customMaterial.elasticModulus}
                    onChange={(e) => setCustomMaterial({...customMaterial, elasticModulus: Number(e.target.value)})}
                  />
                  <Input
                    type="number"
                    placeholder="Density (kg/m³)"
                    value={customMaterial.density}
                    onChange={(e) => setCustomMaterial({...customMaterial, density: Number(e.target.value)})}
                  />
                  <Input
                    type="number"
                    placeholder="Poisson's Ratio"
                    value={customMaterial.poissonsRatio}
                    onChange={(e) => setCustomMaterial({...customMaterial, poissonsRatio: Number(e.target.value)})}
                  />
                  <Input
                    type="number"
                    placeholder="Thermal Expansion (μm/m·K)"
                    value={customMaterial.thermalExpansion}
                    onChange={(e) => setCustomMaterial({...customMaterial, thermalExpansion: Number(e.target.value)})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (mm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>Load Type</Label>
                <RadioGroup value={loadType} onValueChange={setLoadType} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Point Load" id="point-load" />
                    <Label htmlFor="point-load">Point Load</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Uniform Load" id="uniform-load" />
                    <Label htmlFor="uniform-load">Uniform Load</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="loadMagnitude">Load Magnitude (N)</Label>
                <Input
                  id="loadMagnitude"
                  type="number"
                  value={loadMagnitude}
                  onChange={(e) => setLoadMagnitude(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="loadStartPosition">Load Start Position (mm from left support)</Label>
                <Input
                  id="loadStartPosition"
                  type="number"
                  value={loadStartPosition}
                  onChange={(e) => setLoadStartPosition(Number(e.target.value))}
                />
              </div>

              {loadType === 'Uniform Load' && (
                <div>
                  <Label htmlFor="loadEndPosition">Load End Position (mm from left support)</Label>
                  <Input
                    id="loadEndPosition"
                    type="number"
                    value={loadEndPosition}
                    onChange={(e) => setLoadEndPosition(Number(e.target.value))}
                  />
                </div>
              )}

              <Button type="button" onClick={calculateResults}>Calculate</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-blue-600 font-medium">Material</div>
                  <div className="font-semibold">{material}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">Yield Strength</div>
                  <div className="font-semibold">{standardMaterials[material].yieldStrength} MPa</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">Elastic Modulus</div>
                  <div className="font-semibold">{standardMaterials[material].elasticModulus} GPa</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-blue-600 font-medium">Density</div>
                  <div className="font-semibold">{standardMaterials[material].density} kg/m³</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">Poisson's Ratio</div>
                  <div className="font-semibold">{standardMaterials[material].poissonsRatio}</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">Thermal Expansion</div>
                  <div className="font-semibold">{standardMaterials[material].thermalExpansion} μm/m·K</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-600 font-medium">Cross-sectional Area</div>
                  <div className="font-semibold">{(width * height).toFixed(2)} mm²</div>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">Moment of Inertia</div>
                  <div className="font-semibold">{((width * Math.pow(height, 3)) / 12).toFixed(2)} mm⁴</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Beam Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <BeamDiagram />
        </CardContent>
      </Card>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shear Force Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                shearForce: {
                  label: "Shear Force",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={shearForceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" label={{ value: 'Position (mm)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Shear Force (N)', angle: -90, position: 'insideLeft' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="shearForce" stroke="var(--color-shearForce)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bending Moment Diagram</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bendingMoment: {
                  label: "Bending Moment",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bendingMomentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" label={{ value: 'Position (mm)', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Bending Moment (N·mm)', angle: -90, position: 'insideLeft' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="bendingMoment" stroke="var(--color-bendingMoment)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Calculation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>Max Shear Force:</div>
            <div>{results.maxShearForce} N</div>
            <div>Max Bending Moment:</div>
            <div>{results.maxBendingMoment} N·mm</div>
            <div>Max Normal Stress:</div>
            <div>{results.maxNormalStress} MPa</div>
            <div>Max Shear Stress:</div>
            <div>{results.maxShearStress} MPa</div>
            <div>Safety Factor:</div>
            <div>{results.safetyFactor}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}