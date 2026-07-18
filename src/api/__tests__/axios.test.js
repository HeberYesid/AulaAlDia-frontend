import { describe, it, expect, beforeEach } from 'vitest';
import { api, setApiActiveTenantId, setAccessToken } from '../axios';

describe('axios api utility', () => {
    beforeEach(() => {
        localStorage.clear();
        setApiActiveTenantId(null);
        setAccessToken(null);
    });

    const reqInterceptor = api.interceptors.request.handlers && api.interceptors.request.handlers.length > 0
        ? api.interceptors.request.handlers[0].fulfilled
        : null;

    it('request interceptor adds headers when tokens and tenant exist', async () => {
        if (!reqInterceptor) return;

        setAccessToken('test-token');
        setApiActiveTenantId('test-tenant');

        const config = { headers: {} };
        const newConfig = await reqInterceptor(config);

        expect(newConfig.headers['Authorization']).toBe('Bearer test-token');
        expect(newConfig.headers['X-Tenant-ID']).toBe('test-tenant');
    });

    it('request interceptor omits Authorization if no token', async () => {
        if (!reqInterceptor) return;

        setApiActiveTenantId('tenant-2');
        const config = { headers: {} };
        const newConfig = await reqInterceptor(config);

        expect(newConfig.headers['Authorization']).toBeUndefined();
        expect(newConfig.headers['X-Tenant-ID']).toBe('tenant-2');
    });

    it('storage persistence check on setActiveTenantId', () => {
        localStorage.setItem('auth', JSON.stringify({ access: 'abc' }));
        setApiActiveTenantId('tenant-999');
        const auth = JSON.parse(localStorage.getItem('auth'));
        expect(auth.active_tenant_id).toBe('tenant-999');
    });

    it('does nothing on setActiveTenantId if no auth local storage', () => {
        setApiActiveTenantId('tenant-888');
        expect(localStorage.getItem('auth')).toBeNull();
    });
});
