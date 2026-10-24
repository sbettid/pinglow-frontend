import { describe, expect, it } from 'vitest';
import type { CheckWithStatus } from '@/types/Check';
import { filterChecks, paginateGroups } from './checkGroups';

function check(
    name: string,
    groupId: string | null,
    groupName: string | null,
    status = 'Ok',
): CheckWithStatus {
    return {
        check_name: name,
        passive: false,
        output: '',
        status,
        timestamp: null,
        notifications_muted: null,
        notifications_muted_until: null,
        group_id: groupId,
        group_name: groupName,
    };
}

const checks = [
    check('router-ping', 'home-network', 'Home Network'),
    check('router-dns', 'home-network', 'Home Network'),
    check('database-health', 'services', 'Services'),
    check('ungrouped-temperature', null, null),
];

describe('filterChecks', () => {
    it('matches every word case-insensitively as a substring, including surrounded asterisks', () => {
        const result = filterChecks(checks, '*HOME* *ROUT*');

        expect(result.groups.map(group => group.id)).toEqual(['home-network']);
        expect(result.groups[0].checks.map(item => item.check_name)).toEqual([
            'router-dns',
            'router-ping',
        ]);
    });

    it('shows all checks when the group matches and only matching checks otherwise', () => {
        const matchingGroup = filterChecks(checks, 'service');
        const matchingCheck = filterChecks(checks, 'dns');

        expect(matchingGroup.groups[0].checks.map(item => item.check_name)).toEqual([
            'database-health',
        ]);
        expect(matchingCheck.groups[0].checks.map(item => item.check_name)).toEqual([
            'router-dns',
        ]);
    });

    it('keeps ungrouped checks standalone and filters them by check name', () => {
        const result = filterChecks(checks, '*temperature*');

        expect(result.groups).toEqual([]);
        expect(result.ungrouped.map(item => item.check_name)).toEqual(['ungrouped-temperature']);
    });

    it('shows all groups and checks when the query contains only wildcard markers', () => {
        const result = filterChecks(checks, '***');

        expect(result.groups).toHaveLength(2);
        expect(result.ungrouped).toHaveLength(1);
    });

    it('summarizes every status present in a group', () => {
        const result = filterChecks([
            check('healthy', 'system', 'System', 'Ok'),
            check('warning', 'system', 'System', 'Warning'),
            check('critical', 'system', 'System', 'Critical'),
            check('broken', 'system', 'System', 'CheckError'),
            check('new', 'system', 'System', 'Pending'),
            check('also-healthy', 'system', 'System', 'Ok'),
        ], '');

        expect(result.groups[0].statuses).toEqual([
            { status: 'Ok', count: 2 },
            { status: 'Warning', count: 1 },
            { status: 'Critical', count: 1 },
            { status: 'CheckError', count: 1 },
            { status: 'Pending', count: 1 },
        ]);
    });

    it('paginates the groups independently of the ungrouped check list', () => {
        const result = filterChecks([
            check('one', 'one', 'One'),
            check('two', 'two', 'Two'),
            check('three', 'three', 'Three'),
            check('standalone', null, null),
        ], '');

        expect(paginateGroups(result.groups, 1, 2).map(group => group.id)).toEqual(['one', 'three']);
        expect(paginateGroups(result.groups, 2, 2).map(group => group.id)).toEqual(['two']);
        expect(result.ungrouped.map(item => item.check_name)).toEqual(['standalone']);
    });
});
