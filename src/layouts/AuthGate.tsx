import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/utils/useIsMobile';
import { initialStaffMembers } from '@/config/staff';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Building2, Loader2 } from 'lucide-react';
import { USE_API } from '@/lib/featureFlag';
import { api, ApiError } from '@/lib/api';

interface LoginApiResponse {
  access_token: string;
  refresh_token: string;
  staff: {
    id: number;
    name: string;
    phone: string;
    roles: string[];
    assigned_buildings: string[];
  };
}

export function AuthGate() {
  const setLoggedInId = useAuthStore((s) => s.setLoggedInId);
  const login = useAuthStore((s) => s.login);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const handleLogin = async () => {
    if (USE_API) {
      setIsLoading(true);
      setLoginError('');
      try {
        const data = await api.post<LoginApiResponse>('/api/auth/login', {
          phone: loginPhone,
          password: loginPw,
        });
        login({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          staff: data.staff,
        });
        setLoginPhone('');
        setLoginPw('');
      } catch (e) {
        if (e instanceof ApiError) {
          setLoginError('연락처 또는 비밀번호가 일치하지 않습니다');
        } else {
          setLoginError('서버에 연결할 수 없습니다');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      const staff = initialStaffMembers.find((s) => s.phone === loginPhone && s.pw === loginPw);
      if (staff) {
        setLoggedInId(staff.id);
        setLoginError('');
        setLoginPhone('');
        setLoginPw('');
      } else {
        setLoginError('연락처 또는 비밀번호가 일치하지 않습니다');
      }
    }
  };

  const formContent = (
    <div className={cn('w-full', isMobile ? 'px-8' : 'max-w-[380px] px-6')}>
      {/* Logo — mobile only */}
      {isMobile && (
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] inline-flex items-center justify-center mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <div className="text-[22px] font-black text-[#1A1D23] tracking-tight">HOUSEMAN</div>
          <div className="text-xs text-[#8F95A3] mt-1">건물관리 시스템</div>
        </div>
      )}

      {/* Heading — desktop only */}
      {!isMobile && (
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1A1D23] tracking-tight">로그인</h1>
          <p className="text-sm text-[#8F95A3] mt-1">계정 정보를 입력해 주세요</p>
        </div>
      )}

      {/* Phone input */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold text-[#5F6577] mb-1.5">연락처 (ID)</label>
        <Input
          value={loginPhone}
          onChange={(e) => { setLoginPhone(e.target.value); setLoginError(''); }}
          placeholder="010-0000-0000"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
          className="h-11"
          disabled={isLoading}
        />
      </div>

      {/* Password input */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold text-[#5F6577] mb-1.5">비밀번호</label>
        <Input
          type="password"
          value={loginPw}
          onChange={(e) => { setLoginPw(e.target.value); setLoginError(''); }}
          placeholder="비밀번호 입력"
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleLogin()}
          className="h-11"
          disabled={isLoading}
        />
      </div>

      {/* Error message */}
      {loginError && (
        <div className="px-3.5 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] mb-4">
          <span className="text-xs font-semibold text-[#DC2626]">{loginError}</span>
        </div>
      )}

      {/* Login button */}
      <Button
        onClick={handleLogin}
        disabled={!loginPhone || !loginPw || isLoading}
        className={cn(
          'w-full h-12 text-[15px] font-extrabold rounded-[10px] transition-all duration-200',
          loginPhone && loginPw && !isLoading
            ? 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB] hover:shadow-lg hover:brightness-110'
            : '',
        )}
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : '로그인'}
      </Button>

      {/* Test accounts */}
      <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E8ECF0]">
        <div className="text-[10px] font-bold text-[#8F95A3] mb-2.5">테스트 계정</div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#5F6577]">
          {initialStaffMembers.map((s) => (
            <div
              key={s.id}
              onClick={() => { setLoginPhone(s.phone); setLoginPw(s.pw); setLoginError(''); }}
              className="px-2.5 py-2 rounded-lg cursor-pointer bg-white border border-[#E8ECF0] transition-all duration-150 hover:border-[#3B82F6] hover:bg-[#EFF6FF]"
            >
              <span className="font-bold">{s.name}</span>
              <span className="text-[#B0B5C1] ml-1 text-[9px]">{s.pw}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Mobile: single column layout
  if (isMobile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#1B1F2E] to-[#2A3352]">
        <div className="w-[380px] p-9 rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          {formContent}
        </div>
      </div>
    );
  }

  // Desktop: two-column layout
  return (
    <div className="h-screen flex">
      {/* Left brand panel */}
      <div className="w-[480px] shrink-0 bg-gradient-to-br from-[#1B1F2E] to-[#2A3352] flex flex-col items-center justify-center relative">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] inline-flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(59,130,246,0.3)]">
            <Building2 size={40} className="text-white" />
          </div>
          <div className="text-3xl font-black text-white tracking-tight mb-2">HOUSEMAN</div>
          <div className="text-sm text-[#9CA3B0]">건물관리의 새로운 기준</div>
        </div>
        <div className="absolute bottom-6 text-[10px] text-[#4B5563]">
          &copy; 2026 Houseman
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center">
        {formContent}
      </div>
    </div>
  );
}
