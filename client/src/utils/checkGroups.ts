import type { CheckWithStatus } from '@/types/Check';

export interface VisibleCheckGroup {
    id: string;
    name: string;
    checks: CheckWithStatus[];
    statuses: StatusCount[];
}

export interface StatusCount {
    status: string;
    count: number;
}

export interface FilteredChecks {
    groups: VisibleCheckGroup[];
    ungrouped: CheckWithStatus[];
}

export function paginateGroups(
    groups: VisibleCheckGroup[],
    page: number,
    pageSize: number,
): VisibleCheckGroup[] {
    const start = (page - 1) * pageSize;
    return groups.slice(start, start + pageSize);
}

export function filterChecks(checks: CheckWithStatus[], query: string): FilteredChecks {
    const terms = query
        .trim()
        .split(/\s+/)
        .map(term => term.replace(/^\*+|\*+$/g, '').toLocaleLowerCase())
        .filter(Boolean);
    const groups = new Map<string, {
        id: string;
        name: string;
        searchText: string;
        checks: CheckWithStatus[];
    }>();

    for (const check of checks) {
        if (!check.group_id) continue;

        const groupId = check.group_id;
        const groupName = check.group_name ?? groupId;
        const key = `group:${groupId}`;
        const group = groups.get(key) ?? {
            id: groupId,
            name: groupName,
            searchText: `${groupName} ${groupId}`.toLocaleLowerCase(),
            checks: [],
        };
        group.checks.push(check);
        groups.set(key, group);
    }

    const visibleGroups = Array.from(groups.values())
        .map(group => {
            const groupMatches = terms.every(term => group.searchText.includes(term));
            const visibleGroupChecks = group.checks.filter(check =>
                groupMatches ||
                terms.every(term =>
                    `${check.check_name} ${group.name} ${group.id}`.toLocaleLowerCase().includes(term),
                ),
            ).sort((left, right) => left.check_name.localeCompare(right.check_name));

            return {
                id: group.id,
                name: group.name,
                checks: visibleGroupChecks,
                statuses: summarizeStatuses(visibleGroupChecks),
            };
        })
        .filter(group => group.checks.length > 0)
        .sort((left, right) => left.name.localeCompare(right.name));

    const ungrouped = checks
        .filter(check =>
            !check.group_id &&
            terms.every(term => check.check_name.toLocaleLowerCase().includes(term)),
        )
        .sort((left, right) => left.check_name.localeCompare(right.check_name));

    return { groups: visibleGroups, ungrouped };
}

function summarizeStatuses(checks: CheckWithStatus[]): StatusCount[] {
    const counts = new Map<string, number>();
    for (const check of checks) {
        const status = check.status;
        counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return ['Ok', 'Warning', 'Critical', 'CheckError', 'Pending']
        .flatMap(status => {
            const count = counts.get(status);
            return count === undefined ? [] : [{ status, count }];
        });
}
