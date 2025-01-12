'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export default function TestComponents() {
  const [switchChecked, setSwitchChecked] = useState(false)
  const [selectValue, setSelectValue] = useState("")
  const [checkboxChecked, setCheckboxChecked] = useState(false)

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Component Test Page</CardTitle>
          <CardDescription>Testing shadcn components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Switch Test */}
          <div className="flex items-center justify-between">
            <Label htmlFor="test-switch">Test Switch</Label>
            <Switch
              id="test-switch"
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
            />
          </div>

          {/* Select Test */}
          <div className="space-y-2">
            <Label>Test Select</Label>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option 1</SelectItem>
                <SelectItem value="2">Option 2</SelectItem>
                <SelectItem value="3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Checkbox Test */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="test-checkbox"
              checked={checkboxChecked}
              onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
            />
            <Label htmlFor="test-checkbox">Test Checkbox</Label>
          </div>

          {/* State Display */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Current State</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded-lg">
                {JSON.stringify({
                  switch: switchChecked,
                  select: selectValue,
                  checkbox: checkboxChecked
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
} 