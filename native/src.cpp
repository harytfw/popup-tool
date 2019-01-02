#include <iostream>
#include <windows.h>
#include <stdlib.h>

char rbuf[BUFSIZ] = { 0 };
char wbuf[BUFSIZ] = { 0 };
char cbuf[BUFSIZ] = { 0 };

void read_message() {
	size_t length = 0;
	memset(rbuf, 0, BUFSIZ);
	fread(&length, sizeof(size_t), 1, stdin);
	fread(rbuf, sizeof(char), length, stdin);
}

void write_message() {
	size_t t_length = strlen(wbuf);
	fwrite(&t_length, sizeof(size_t), 1, stdout);
	fwrite(wbuf, sizeof(char), t_length, stdout);
	fflush(stdout);
	memset(wbuf, 0, BUFSIZ);
}

void setOnTop(HWND hwnd) {
	SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}

void unsetOnTop(HWND hwnd) {
	SetWindowPos(hwnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}

int main()
{
	read_message();
	//sprintf_s(rbuf, "off");
	HWND fgwin = GetForegroundWindow();
	if (strcmp(rbuf, "\"on\"") == 0) {
		setOnTop(fgwin);
		sprintf_s(wbuf, "\"done\"");
		write_message();
	}
	else if (strcmp(rbuf, "\"off\"") == 0) {
		unsetOnTop(fgwin);
		sprintf_s(wbuf, "\"done\"");
		write_message();
	}
	else {
		sprintf_s(wbuf, "{\"msg\":\"wrong message\"}");
		write_message();
	}
	return 0;
}