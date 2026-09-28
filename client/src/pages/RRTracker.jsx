import React from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Chip } from '@mui/material';

const RRTracker = () => {
  const beneficiaries = [
    { id: 1, name: 'Ramesh Kumar', survey: '123/4', entitlement: 500000, disbursed: 250000, status: 'In Progress' },
    { id: 2, name: 'Sita Devi', survey: '123/15', entitlement: 750000, disbursed: 750000, status: 'Completed' },
    { id: 3, name: 'Arun Singh', survey: '123/42', entitlement: 300000, disbursed: 0, status: 'Pending Verification' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, fontFamily: 'Plus Jakarta Sans' }}>
        R&R Tracker
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Real-time compensation disbursement tracking and entitlement monitoring.
      </Typography>

      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Beneficiary</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Survey No</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Entitlement (₹)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Disbursed (₹)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {beneficiaries.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.survey}</TableCell>
                  <TableCell>{b.entitlement.toLocaleString()}</TableCell>
                  <TableCell>{b.disbursed.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress variant="determinate" value={(b.disbursed / b.entitlement) * 100} 
                          color={b.disbursed === b.entitlement ? 'success' : 'primary'} />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">{Math.round((b.disbursed / b.entitlement) * 100)}%</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={b.status} 
                      color={b.status === 'Completed' ? 'success' : b.status === 'In Progress' ? 'info' : 'default'} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default RRTracker;
