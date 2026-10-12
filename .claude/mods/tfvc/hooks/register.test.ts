import { expect, test } from 'claude-code/testing'

import { countStatus, findWorkspace, needsNoprompt, parseWorkspaces } from './register'

const XML = `<WorkspaceInfo name="WS-1" isLocalWorkspace="true"><MappedPaths>
<MappedPath path="C:\\Src\\Workspace\\MyApp" />
<MappedPath path="C:\\Src\\Lab" /></MappedPaths></WorkspaceInfo>`

test('detects only paths inside a mapping', () => {
  const ws = parseWorkspaces(XML)
  expect(findWorkspace('c:/src/workspace/myapp/Web', ws)?.name).toBe('WS-1')
  expect(findWorkspace('C:\\Src\\Workspace\\MyApp', ws)?.name).toBe('WS-1')
  expect(findWorkspace('C:\\Src\\Workspace\\MyApp2', ws)).toBe(undefined)
  expect(findWorkspace('C:\\Src\\Lab\\x', ws)?.name).toBe('WS-1')
  expect(findWorkspace('C:\\Users\\me', ws)).toBe(undefined)
})

test('reads tf status counts', () => {
  expect(countStatus('...\n87 change(s), 75 detected change(s)')).toEqual({ pending: 87, detected: 75 })
  expect(countStatus('3 change(s)')).toEqual({ pending: 3, detected: 0 })
  expect(countStatus('There are no pending changes.')).toEqual({ pending: 0, detected: 0 })
})

test('flags tf write commands without /noprompt', () => {
  expect(needsNoprompt('tf checkin SSO /comment:"x"')).toBe(true)
  expect(needsNoprompt('& "C:\\x\\TF.exe" merge $/A $/B /recursive')).toBe(true)
  expect(needsNoprompt('tf checkin SSO /comment:"x" /noprompt')).toBe(false)
  expect(needsNoprompt('tf status /recursive')).toBe(false)
  expect(needsNoprompt('git get-tf')).toBe(false)
})
